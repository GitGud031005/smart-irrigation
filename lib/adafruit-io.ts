// Adafruit IO REST API client
// Base URL: https://io.adafruit.com/api/v2
// Auth: X-AIO-Key header

const AIO_BASE_URL = "https://io.adafruit.com/api/v2";

export interface AIOCredentials {
  username: string;
  key: string;
}

function makeHeaders(credentials: AIOCredentials) {
  return {
    "X-AIO-Key": credentials.key,
    "Content-Type": "application/json",
  };
}

function feedUrl(feedKey: string, credentials: AIOCredentials) {
  return `${AIO_BASE_URL}/${credentials.username}/feeds/${feedKey}`;
}

// ─── Types ───────────────────────────────────────────────────────────

export interface AIODataPoint {
  id: string;
  value: string;
  feed_id: number;
  feed_key: string;
  created_at: string;
  created_epoch: number;
  expiration: string;
  lat: number | null;
  lon: number | null;
  ele: number | null;
}

export interface AIOFeed {
  id: number;
  name: string;
  key: string;
  description: string;
  last_value: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// ─── Feed operations ─────────────────────────────────────────────────

/** Get all feeds for the authenticated user */
export async function getAllFeeds(credentials: AIOCredentials): Promise<AIOFeed[]> {
  const res = await fetch(`${AIO_BASE_URL}/${credentials.username}/feeds`, {
    headers: makeHeaders(credentials),
  });
  if (!res.ok) throw new Error(`Adafruit IO error ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Get feed details by key */
export async function getFeed(feedKey: string, credentials: AIOCredentials): Promise<AIOFeed> {
  const res = await fetch(feedUrl(feedKey, credentials), { headers: makeHeaders(credentials) });
  if (!res.ok) throw new Error(`Adafruit IO error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── Data operations ─────────────────────────────────────────────────

/** Get the latest data point from a feed */
export async function getLastData(feedKey: string, credentials: AIOCredentials): Promise<AIODataPoint> {
  const res = await fetch(`${feedUrl(feedKey, credentials)}/data/last`, {
    headers: makeHeaders(credentials),
  });
  if (!res.ok) throw new Error(`Adafruit IO error ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Get historical data from a feed */
export async function getFeedData(
  feedKey: string,
  credentials: AIOCredentials,
  params?: {
    limit?: number;
    start_time?: string;
    end_time?: string;
  }
): Promise<AIODataPoint[]> {
  const url = new URL(`${feedUrl(feedKey, credentials)}/data`);
  if (params?.limit) url.searchParams.set("limit", String(params.limit));
  if (params?.start_time) url.searchParams.set("start_time", params.start_time);
  if (params?.end_time) url.searchParams.set("end_time", params.end_time);

  const res = await fetch(url.toString(), { headers: makeHeaders(credentials) });
  if (!res.ok) throw new Error(`Adafruit IO error ${res.status}: ${await res.text()}`);
  return res.json();
}

/** Send a data point to a feed (used for control — e.g. turning pump ON/OFF) */
export async function sendData(
  feedKey: string,
  value: string,
  credentials: AIOCredentials
): Promise<AIODataPoint> {
  const res = await fetch(`${feedUrl(feedKey, credentials)}/data`, {
    method: "POST",
    headers: makeHeaders(credentials),
    body: JSON.stringify({ value }),
  });
  if (!res.ok) throw new Error(`Adafruit IO error ${res.status}: ${await res.text()}`);
  return res.json();
}

// ─── Convenience helpers for this project's feeds ────────────────────

const FEED_KEYS = {
  soilMoisture: () => process.env.ADAFRUIT_IO_FEED_SOIL_MOISTURE || "soil-moisture",
  temperature: () => process.env.ADAFRUIT_IO_FEED_TEMPERATURE || "temperature",
  humidity: () => process.env.ADAFRUIT_IO_FEED_HUMIDITY || "humidity",
  pump: () => process.env.ADAFRUIT_IO_FEED_PUMP || "pump",
};

/** Get latest sensor readings from all feeds at once */
export async function getLatestSensorData(credentials: AIOCredentials) {
  const [soilMoisture, temperature, humidity] = await Promise.all([
    getLastData(FEED_KEYS.soilMoisture(), credentials),
    getLastData(FEED_KEYS.temperature(), credentials),
    getLastData(FEED_KEYS.humidity(), credentials),
  ]);

  return {
    soilMoisture: { value: parseFloat(soilMoisture.value), updatedAt: soilMoisture.created_at },
    temperature: { value: parseFloat(temperature.value), updatedAt: temperature.created_at },
    humidity: { value: parseFloat(humidity.value), updatedAt: humidity.created_at },
  };
}

/** Turn the pump ON or OFF via Adafruit IO */
export async function controlPump(action: "1" | "0", credentials: AIOCredentials) {
  return sendData(FEED_KEYS.pump(), action, credentials);
}

/** Get pump status (last value) */
export async function getPumpStatus(credentials: AIOCredentials) {
  const data = await getLastData(FEED_KEYS.pump(), credentials);
  return {
    status: data.value as "1" | "0",
    updatedAt: data.created_at,
  };
}
