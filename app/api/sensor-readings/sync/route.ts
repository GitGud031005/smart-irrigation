// POST /api/sensor-readings/sync — Polls all three Adafruit feeds for new data and batch-inserts
// readings into the DB using a sliding buffer strategy:
// - A reading is only created once all 3 metrics (soilMoisture, temperature, humidity) are present.
// - Whenever any metric updates, a new reading is emitted using the current buffer values.
// - recordedAt is always the timestamp of the most recent event that triggered the emission.

import { NextResponse } from "next/server";
import { getFeedData } from "@/lib/adafruit-io";
import { createSensorReading, getLatestReadingTimestamp } from "@/services/sensor-service";

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

export async function POST() {
  try {
    // Use the last stored reading as the lower bound for dedup
    const lastStored = await getLatestReadingTimestamp("soilMoisture");

    // Fetch new data from all 3 feeds since the last stored reading
    const startTime = lastStored?.toISOString();
    const [soilData, tempData, humData] = await Promise.all([
      getFeedData(process.env.ADAFRUIT_IO_FEED_SOIL_MOISTURE || "soil-moisture", startTime ? { start_time: startTime } : undefined),
      getFeedData(process.env.ADAFRUIT_IO_FEED_TEMPERATURE || "temperature", startTime ? { start_time: startTime } : undefined),
      getFeedData(process.env.ADAFRUIT_IO_FEED_HUMIDITY || "humidity", startTime ? { start_time: startTime } : undefined),
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

    const inserts = await Promise.all(toInsert.map(r => createSensorReading(r)));
    return NextResponse.json({ inserted: inserts.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
