// MQTT client for Adafruit IO broker communication
// Architecture: IoT Gateway Layer — real-time pub/sub for sensor data & pump control
// Adafruit IO MQTT broker: mqtts://io.adafruit.com:8883
// Topics: {username}/feeds/{feed_key}

import mqtt, { MqttClient } from "mqtt";

const AIO_MQTT_HOST = "mqtts://io.adafruit.com";
const AIO_MQTT_PORT = 8883;

export interface AIOCredentials {
  username: string;
  key: string;
}

type MessageHandler = (feedKey: string, value: string) => void;

const clients = new Map<string, MqttClient>();
const listeners = new Map<string, Map<string, Set<MessageHandler>>>();

/** Connect to Adafruit IO MQTT broker (per-user — credentials required) */
export function connectMqtt(credentials: AIOCredentials): MqttClient {
  const clientKey = credentials.username;
  
  if (clients.has(clientKey)) return clients.get(clientKey)!;

  const client = mqtt.connect(AIO_MQTT_HOST, {
    port: AIO_MQTT_PORT,
    username: credentials.username,
    password: credentials.key,
    protocol: "mqtts",
  });

  client.on("connect", () => {
    console.log(`[MQTT] Connected to Adafruit IO as ${credentials.username}`);
  });

  client.on("error", (err: Error) => {
    console.error(`[MQTT] Connection error (${credentials.username}):`, err.message);
  });

  client.on("message", (topic: string, payload: Buffer) => {
    // topic format: {username}/feeds/{feedKey}
    const feedKey = topic.split("/feeds/")[1];
    if (!feedKey) return;

    const value = payload.toString();
    const userListeners = listeners.get(clientKey);
    if (userListeners) {
      const handlers = userListeners.get(feedKey);
      if (handlers) {
        handlers.forEach((handler) => handler(feedKey, value));
      }
    }
  });

  clients.set(clientKey, client);
  listeners.set(clientKey, new Map());
  return client;
}

/** Subscribe to a feed and register a callback for incoming messages */
export function subscribeToFeed(
  credentials: AIOCredentials,
  feedKey: string,
  handler: MessageHandler
) {
  const clientKey = credentials.username;
  const mqttClient = connectMqtt(credentials);
  const topic = `${credentials.username}/feeds/${feedKey}`;

  // Ensure listeners map exists for this user
  if (!listeners.has(clientKey)) {
    listeners.set(clientKey, new Map());
  }

  // Register handler
  const userListeners = listeners.get(clientKey)!;
  if (!userListeners.has(feedKey)) {
    userListeners.set(feedKey, new Set());
  }
  userListeners.get(feedKey)!.add(handler);

  // Subscribe on MQTT broker
  mqttClient.subscribe(topic, (err: Error | null) => {
    if (err) {
      console.error(`[MQTT] Failed to subscribe to ${topic}:`, err.message);
    } else {
      console.log(`[MQTT] Subscribed to ${topic}`);
    }
  });
}

/** Unsubscribe a handler from a feed */
export function unsubscribeFromFeed(
  credentials: AIOCredentials,
  feedKey: string,
  handler: MessageHandler
) {
  const clientKey = credentials.username;
  const userListeners = listeners.get(clientKey);
  if (userListeners) {
    const handlers = userListeners.get(feedKey);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        userListeners.delete(feedKey);
        const client = clients.get(clientKey);
        if (client) {
          client.unsubscribe(`${credentials.username}/feeds/${feedKey}`);
        }
        // Clean up empty user map
        if (userListeners.size === 0) {
          listeners.delete(clientKey);
        }
      }
    }
  }
}

/** Publish a value to a feed (e.g. send pump ON/OFF command) */
export function publishToFeed(
  credentials: AIOCredentials,
  feedKey: string,
  value: string
) {
  const mqttClient = connectMqtt(credentials);
  const topic = `${credentials.username}/feeds/${feedKey}`;

  mqttClient.publish(topic, value, (err?: Error | null) => {
    if (err) {
      console.error(`[MQTT] Failed to publish to ${topic}:`, err.message);
    }
  });
}

/** Disconnect a user's MQTT client */
export function disconnectMqtt(credentials: AIOCredentials) {
  const clientKey = credentials.username;
  const client = clients.get(clientKey);
  if (client) {
    client.end();
    clients.delete(clientKey);
    listeners.delete(clientKey);
    console.log(`[MQTT] Disconnected ${credentials.username} from Adafruit IO`);
  }
}
