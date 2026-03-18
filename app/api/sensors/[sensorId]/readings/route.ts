// GET /api/sensors/[sensorId]/readings - Get sensor readings (time-series data)
// POST /api/sensors/[sensorId]/readings - Log a new sensor reading

import { NextRequest, NextResponse } from "next/server";
import { getFeedData, sendData } from "@/lib/adafruit-io";

// Map sensorId to Adafruit IO feed key
function sensorToFeedKey(sensorId: string): string | null {
  const map: Record<string, string> = {
    "soil-moisture": process.env.ADAFRUIT_IO_FEED_SOIL_MOISTURE || "soil-moisture",
    "temperature": process.env.ADAFRUIT_IO_FEED_TEMPERATURE || "temperature",
    "humidity": process.env.ADAFRUIT_IO_FEED_HUMIDITY || "humidity",
  };
  return map[sensorId] ?? null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sensorId: string }> }
) {
  const { sensorId } = await params;
  const feedKey = sensorToFeedKey(sensorId);
  if (!feedKey) {
    return NextResponse.json({ error: `Unknown sensor: ${sensorId}` }, { status: 404 });
  }

  const { searchParams } = request.nextUrl;
  const limit = searchParams.get("limit");
  const start_time = searchParams.get("start_time") ?? undefined;
  const end_time = searchParams.get("end_time") ?? undefined;

  try {
    const data = await getFeedData(feedKey, {
      limit: limit ? parseInt(limit, 10) : 10,
      start_time,
      end_time,
    });
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sensorId: string }> }
) {
  const { sensorId } = await params;
  const feedKey = sensorToFeedKey(sensorId);
  if (!feedKey) {
    return NextResponse.json({ error: `Unknown sensor: ${sensorId}` }, { status: 404 });
  }

  let body: { value?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.value === undefined) {
    return NextResponse.json({ error: "Missing 'value'" }, { status: 400 });
  }

  try {
    const result = await sendData(feedKey, String(body.value));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
