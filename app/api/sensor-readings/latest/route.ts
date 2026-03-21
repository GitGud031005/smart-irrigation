// GET /api/sensor-readings/latest — Fetch the latest readings from each Adafruit feed.
// Only persists when all 3 metrics (soilMoisture, temperature, humidity) are valid.
// recordedAt is set to the timestamp of the most recently updated feed.

import { NextResponse } from "next/server";
import { getLatestSensorData } from "@/lib/adafruit-io";
// import { createSensorReading } from "@/services/sensor-service";

export async function GET() {
  try {
    const data = await getLatestSensorData();
    const { soilMoisture, temperature, humidity } = data;

    // Buffer check: all 3 must be valid finite numbers before persisting
    if (!isFinite(soilMoisture.value) || !isFinite(temperature.value) || !isFinite(humidity.value)) {
      return NextResponse.json(
        { status: "not_enough_data", message: "Not all sensor feeds have valid data yet.", data },
        { status: 202 }
      );
    }

    // Use the timestamp of whichever feed updated most recently
    // const recordedAt = new Date(
    //   Math.max(
    //     new Date(soilMoisture.updatedAt).getTime(),
    //     new Date(temperature.updatedAt).getTime(),
    //     new Date(humidity.updatedAt).getTime(),
    //   )
    // );

    // const reading = await createSensorReading({
    //   soilMoisture: soilMoisture.value,
    //   temperature: temperature.value,
    //   humidity: humidity.value,
    //   recordedAt,
    // });

    return NextResponse.json({
      ...data,
    //   savedReadingId: reading.id,
    //   savedAt: reading.recordedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
