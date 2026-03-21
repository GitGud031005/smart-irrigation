// GET /api/sensor-readings/latest — Fetch the latest sensor readings from Adafruit IO and persist to DB

import { NextResponse } from "next/server";
import { getLatestSensorData } from "@/lib/adafruit-io";
import { createSensorReading } from "@/services/sensor-service";

export async function GET() {
  try {
    const data = await getLatestSensorData();
    const reading = await createSensorReading({
      soilMoisture: data.soilMoisture.value,
      temperature: data.temperature.value,
      humidity: data.humidity.value,
    });
    return NextResponse.json({
      ...data,
      savedReadingId: reading.id,
      savedAt: reading.recordedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
