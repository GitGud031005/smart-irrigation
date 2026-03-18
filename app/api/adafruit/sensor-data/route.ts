// GET /api/adafruit/sensor-data — Get latest readings from all sensor feeds at once

import { NextResponse } from "next/server";
import { getLatestSensorData } from "@/lib/adafruit-io";

export async function GET() {
  try {
    const data = await getLatestSensorData();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
