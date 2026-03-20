// GET  /api/sensors/[sensorId]/readings - Get readings from DB (?since=&until=&take=)
// POST /api/sensors/[sensorId]/readings - Create a new sensor reading in DB

import { NextRequest, NextResponse } from "next/server";
import {
  querySensorReadings,
  createSensorReading,
  getSensor,
} from "@/services/sensor-service";
import { toJsonSafe } from "@/lib/utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sensorId: string }> }
) {
  const { sensorId } = await params;

  // Verify sensor exists
  const sensor = await getSensor(sensorId);
  if (!sensor) {
    return NextResponse.json({ error: "Sensor not found" }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const since = searchParams.get("since") ? new Date(searchParams.get("since")!) : undefined;
  const until = searchParams.get("until") ? new Date(searchParams.get("until")!) : undefined;
  const take = searchParams.get("take") ? parseInt(searchParams.get("take")!, 10) : undefined;

  try {
    const readings = await querySensorReadings({ sensorId, since, until, take });
    return new NextResponse(JSON.stringify(toJsonSafe(readings)), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sensorId: string }> }
) {
  const { sensorId } = await params;

  const sensor = await getSensor(sensorId);
  if (!sensor) {
    return NextResponse.json({ error: "Sensor not found" }, { status: 404 });
  }

  let body: { soilMoisture?: number; temperature?: number; humidity?: number; recordedAt?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const reading = await createSensorReading({
      sensorId,
      soilMoisture: body.soilMoisture,
      temperature: body.temperature,
      humidity: body.humidity,
      recordedAt: body.recordedAt ? new Date(body.recordedAt) : undefined,
    });
    return new NextResponse(JSON.stringify(toJsonSafe(reading)), {
      headers: { "Content-Type": "application/json" },
      status: 201,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
