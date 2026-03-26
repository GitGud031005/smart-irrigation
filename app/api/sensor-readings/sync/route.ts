// POST /api/sensor-readings/sync — Polls all three Adafruit feeds for new data and batch-inserts
// readings into the DB using a sliding buffer strategy:
// - A reading is only created once all 3 metrics (soilMoisture, temperature, humidity) are present.
// - Whenever any metric updates, a new reading is emitted using the current buffer values.
// - recordedAt is always the timestamp of the most recent event that triggered the emission.

import { NextRequest, NextResponse } from "next/server";
import { getFeedData } from "@/lib/adafruit-io";
import { createSensorReading, getLatestSensorReading } from "@/services/sensor-service";
import { getDeviceInZone } from "@/services/device-service";
import { getZone } from "@/services/zone-service";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { getUserById } from "@/services/auth-service";

interface AdafruitDatum {
  value: string;
  created_at: string;
}

type MetricKey = "soilMoisture" | "temperature" | "humidity";

interface BufferState {
  soilMoisture: number | null;
  temperature: number | null;
  humidity: number | null;
}

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const dbUser = await getUserById(payload.userId)
  if (!dbUser || !dbUser.adafruitUsername || !dbUser.adafruitKey) {
    return NextResponse.json({ error: 'Adafruit IO credentials not configured. Please set them in the header settings.' }, { status: 422 })
  }
  const credentials = { username: dbUser.adafruitUsername, key: dbUser.adafruitKey }

  let body: { zoneId?: string } = {}
  try { body = await request.json() } catch { /* body is optional */ }

  const zoneId = body.zoneId
  if (!zoneId) return NextResponse.json({ error: 'zoneId is required in the request body' }, { status: 400 })

  const zone = await getZone(zoneId)
  if (!zone) return NextResponse.json({ error: 'Zone not found' }, { status: 404 })

  try {
    // Zone → devices in zone by type → feedKey (required)
    const [soilDevice, tempDevice, humDevice] = await Promise.all([
      getDeviceInZone(zoneId, "SOIL_MOISTURE_SENSOR"),
      getDeviceInZone(zoneId, "DHT20_TEMPERATURE_SENSOR"),
      getDeviceInZone(zoneId, "DHT20_HUMIDITY_SENSOR"),
    ]);

    if (!soilDevice?.feedKey || !tempDevice?.feedKey || !humDevice?.feedKey) {
      return NextResponse.json(
        { error: "Sensor devices in this zone are missing feed key configuration" },
        { status: 422 }
      );
    }

    const soilFeedKey = soilDevice.feedKey;
    const tempFeedKey = tempDevice.feedKey;
    const humFeedKey = humDevice.feedKey;

    // Use the last stored reading as the lower bound for dedup
    const lastStored = await getLatestSensorReading(zoneId).then(r => r?.recordedAt ? new Date(r.recordedAt) : null);

    // Fetch new data from all 3 feeds since the last stored reading
    const startTime = lastStored?.toISOString();
    const [soilData, tempData, humData] = await Promise.all([
      getFeedData(soilFeedKey, credentials, startTime ? { start_time: startTime } : undefined),
      getFeedData(tempFeedKey, credentials, startTime ? { start_time: startTime } : undefined),
      getFeedData(humFeedKey, credentials, startTime ? { start_time: startTime } : undefined),
    ]);

    // Tag each datum with its metric, parse value, and filter out already-stored or invalid entries
    type TaggedDatum = { metric: MetricKey; value: number; ts: Date };
    const tagged: TaggedDatum[] = [
      ...(soilData as AdafruitDatum[]).map(d => ({ metric: "soilMoisture" as MetricKey, value: parseFloat(d.value), ts: new Date(d.created_at) })),
      ...(tempData as AdafruitDatum[]).map(d => ({ metric: "temperature" as MetricKey, value: parseFloat(d.value), ts: new Date(d.created_at) })),
      ...(humData as AdafruitDatum[]).map(d => ({ metric: "humidity" as MetricKey, value: parseFloat(d.value), ts: new Date(d.created_at) })),
    ]
      .filter(d => isFinite(d.value) && (!lastStored || d.ts > lastStored))
      .sort((a, b) => a.ts.getTime() - b.ts.getTime());

    if (tagged.length === 0) {
      return NextResponse.json({ inserted: 0, message: "No new data from any feed." });
    }

    // Sliding buffer: emit a reading whenever all 3 metrics are populated and any one changes.
    // recordedAt = the timestamp of the event that triggered the emission.
    const buffer: BufferState = { soilMoisture: null, temperature: null, humidity: null };
    const toInsert: { soilMoisture: number; temperature: number; humidity: number; recordedAt: Date }[] = [];

    for (const datum of tagged) {
      buffer[datum.metric] = datum.value;

      if (buffer.soilMoisture !== null && buffer.temperature !== null && buffer.humidity !== null) {
        toInsert.push({
          soilMoisture: buffer.soilMoisture,
          temperature: buffer.temperature,
          humidity: buffer.humidity,
          recordedAt: datum.ts, // timestamp of the latest update that completed the buffer
        });
      }
    }

    if (toInsert.length === 0) {
      return NextResponse.json({
        inserted: 0,
        message: "Not enough data — one or more sensor feeds had no readings.",
      });
    }

    const inserts = await Promise.all(toInsert.map(r => createSensorReading({ ...r, zoneId })));
    return NextResponse.json({ inserted: inserts.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
