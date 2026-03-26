// GET /api/sensor-readings/latest?zoneId=<id> — Fetch the latest readings from each Adafruit feed.
// Flow: zone → devices in zone by type → feedKey → Adafruit IO REST API

import { NextRequest, NextResponse } from "next/server";
import { getLatestSensorData } from "@/lib/adafruit-io";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { getUserById } from "@/services/auth-service";
import { getDeviceInZone } from "@/services/device-service";
import { getZone } from "@/services/zone-service";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const dbUser = await getUserById(payload.userId);
  if (!dbUser || !dbUser.adafruitUsername || !dbUser.adafruitKey) {
    return NextResponse.json(
      { error: "Adafruit IO credentials not configured. Please set them in the header settings." },
      { status: 422 }
    );
  }
  const credentials = { username: dbUser.adafruitUsername, key: dbUser.adafruitKey };

  const zoneId = request.nextUrl.searchParams.get("zoneId");
  if (!zoneId) return NextResponse.json({ error: "zoneId query parameter is required" }, { status: 400 });

  const zone = await getZone(zoneId);
  if (!zone) return NextResponse.json({ error: "Zone not found" }, { status: 404 });

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

    const feedKeys = {
      soilMoisture: soilDevice.feedKey,
      temperature: tempDevice.feedKey,
      humidity: humDevice.feedKey,
    };

    const data = await getLatestSensorData(credentials, feedKeys);
    const { soilMoisture, temperature, humidity } = data;

    if (!isFinite(soilMoisture.value) || !isFinite(temperature.value) || !isFinite(humidity.value)) {
      return NextResponse.json(
        { status: "not_enough_data", message: "Not all sensor feeds have valid data yet.", data },
        { status: 202 }
      );
    }

    return NextResponse.json({ zoneId, zoneName: zone.name, ...data });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
