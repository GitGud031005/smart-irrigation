// MQTT client for Adafruit IO broker communication
// Architecture: IoT Gateway Layer — real-time pub/sub for sensor data & pump control
// Adafruit IO MQTT broker: mqtts://io.adafruit.com:8883
// Topics: {username}/feeds/{feed_key}

import mqtt, { MqttClient } from "mqtt";

const AIO_MQTT_HOST = "mqtts://io.adafruit.com";
const AIO_MQTT_PORT = 8883;

function getConfig() {
  const username = process.env.ADAFRUIT_IO_USERNAME;
  const key = process.env.ADAFRUIT_IO_KEY;
  if (!username || !key) {
    throw new Error(
      "Missing ADAFRUIT_IO_USERNAME or ADAFRUIT_IO_KEY in environment"
    );
  }
  return { username, key };
}

type MessageHandler = (feedKey: string, value: string) => void;

let client: MqttClient | null = null;
const listeners = new Map<string, Set<MessageHandler>>();

/** Connect to Adafruit IO MQTT broker (singleton — safe to call multiple times) */
export function connectMqtt(): MqttClient {
  if (client) return client;

  const { username, key } = getConfig();

  client = mqtt.connect(AIO_MQTT_HOST, {
    port: AIO_MQTT_PORT,
    username: username,
    password: key,
    protocol: "mqtts",
  });

  client.on("connect", () => {
    console.log("[MQTT] Connected to Adafruit IO");
  });

  client.on("error", (err: Error) => {
    console.error("[MQTT] Connection error:", err.message);
  });

  client.on("message", (topic: string, payload: Buffer) => {
    // topic format: {username}/feeds/{feedKey}
    const feedKey = topic.split("/feeds/")[1];
    if (!feedKey) return;

    const value = payload.toString();
    const handlers = listeners.get(feedKey);
    if (handlers) {
      handlers.forEach((handler) => handler(feedKey, value));
    }
  });

  return client;
}

/** Subscribe to a feed and register a callback for incoming messages */
export function subscribeToFeed(feedKey: string, handler: MessageHandler) {
  const mqttClient = connectMqtt();
  const { username } = getConfig();
  const topic = `${username}/feeds/${feedKey}`;

  // Register handler
  if (!listeners.has(feedKey)) {
    listeners.set(feedKey, new Set());
  }
  listeners.get(feedKey)!.add(handler);

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
export function unsubscribeFromFeed(feedKey: string, handler: MessageHandler) {
  const handlers = listeners.get(feedKey);
  if (handlers) {
    handlers.delete(handler);
    if (handlers.size === 0) {
      listeners.delete(feedKey);
      if (client) {
        const { username } = getConfig();
        client.unsubscribe(`${username}/feeds/${feedKey}`);
      }
    }
  }
}

/** Publish a value to a feed (e.g. send pump ON/OFF command) */
export function publishToFeed(feedKey: string, value: string) {
  const mqttClient = connectMqtt();
  const { username } = getConfig();
  const topic = `${username}/feeds/${feedKey}`;

  mqttClient.publish(topic, value, (err?: Error | null) => {
    if (err) {
      console.error(`[MQTT] Failed to publish to ${topic}:`, err.message);
    }
  });
}

/** Disconnect the MQTT client */
export function disconnectMqtt() {
  if (client) {
    client.end();
    client = null;
    listeners.clear();
    console.log("[MQTT] Disconnected from Adafruit IO");
  }
}
