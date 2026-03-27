// GET /api/sensor-readings/stream?zoneId=<id> — SSE endpoint for live sensor readings.
// Flow: zone → devices in zone by type → feedKey → MQTT subscription
// Subscribes to Adafruit IO MQTT feeds server-side and pushes new combined readings
// to the browser via Server-Sent Events whenever all 3 metrics are buffered.

import { NextRequest } from "next/server";
import { subscribeToFeed, unsubscribeFromFeed } from "@/lib/mqtt";
import { getDeviceInZone, updateDevice } from "@/services/device-service";
import { getZone } from "@/services/zone-service";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { getUserById } from "@/services/auth-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const zoneId = request.nextUrl.searchParams.get("zoneId");
  if (!zoneId) {
    return new Response(JSON.stringify({ error: "zoneId query parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Auth — get user's Adafruit credentials
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return new Response(JSON.stringify({ error: "Invalid token" }), { status: 401, headers: { "Content-Type": "application/json" } });
  }
  const dbUser = await getUserById(payload.userId);
  if (!dbUser || !dbUser.adafruitUsername || !dbUser.adafruitKey) {
    return new Response(JSON.stringify({ error: "Adafruit IO credentials not configured" }), { status: 422, headers: { "Content-Type": "application/json" } });
  }
  const credentials = { username: dbUser.adafruitUsername, key: dbUser.adafruitKey };

  const zone = await getZone(zoneId);
  if (!zone) {
    return new Response(JSON.stringify({ error: "Zone not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Zone → devices in zone by type → feedKey (required)
  const [soilDevice, tempDevice, humDevice] = await Promise.all([
    getDeviceInZone(zoneId, "SOIL_MOISTURE_SENSOR"),
    getDeviceInZone(zoneId, "DHT20_TEMPERATURE_SENSOR"),
    getDeviceInZone(zoneId, "DHT20_HUMIDITY_SENSOR"),
  ]);

  if (!soilDevice?.feedKey || !tempDevice?.feedKey || !humDevice?.feedKey) {
    return new Response(JSON.stringify({ error: "Sensor devices in this zone are missing feed key configuration" }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  const feedKeys = {
    soilMoisture: soilDevice.feedKey,
    temperature: tempDevice.feedKey,
    humidity: humDevice.feedKey,
  };

  const deviceIds = [soilDevice.id, tempDevice.id, humDevice.id];

  const INACTIVITY_MS = 10_000;

  /** Flip all sensor devices in this zone to the given status (fire-and-forget). */
  const setSensorStatus = (status: "ACTIVE" | "OFFLINE") => {
    for (const id of deviceIds) {
      updateDevice(id, { status }).catch(() => {});
    }
  };

  const encoder = new TextEncoder();

  const buffer = {
    soilMoisture: null as number | null,
    temperature: null as number | null,
    humidity: null as number | null,
  };

  let cleanup: (() => void) | null = null;
  let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  let isActive = false;

  /** Call on every incoming data point to start/reset the 10-second inactivity window. */
  const onActivity = () => {
    if (!isActive) {
      isActive = true;
      setSensorStatus("ACTIVE");
    }
    if (inactivityTimer !== null) clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      isActive = false;
      setSensorStatus("OFFLINE");
    }, INACTIVITY_MS);
  };

  const stream = new ReadableStream({
    start(controller) {
      const emit = (payload: object) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
          );
        } catch {
          // Stream already closed — client disconnected
        }
      };

      const makeHandler =
        (metric: keyof typeof buffer) => (_feedKey: string, value: string) => {
          const n = parseFloat(value);
          if (!isFinite(n)) return;
          buffer[metric] = n;
          onActivity();
          if (
            buffer.soilMoisture !== null &&
            buffer.temperature !== null &&
            buffer.humidity !== null
          ) {
            emit({
              soilMoisture: buffer.soilMoisture,
              temperature: buffer.temperature,
              humidity: buffer.humidity,
              recordedAt: new Date().toISOString(),
            });
          }
        };

      const soilHandler = makeHandler("soilMoisture");
      const tempHandler = makeHandler("temperature");
      const humHandler = makeHandler("humidity");

      subscribeToFeed(credentials, feedKeys.soilMoisture, soilHandler);
      subscribeToFeed(credentials, feedKeys.temperature, tempHandler);
      subscribeToFeed(credentials, feedKeys.humidity, humHandler);

      cleanup = () => {
        unsubscribeFromFeed(credentials, feedKeys.soilMoisture, soilHandler);
        unsubscribeFromFeed(credentials, feedKeys.temperature, tempHandler);
        unsubscribeFromFeed(credentials, feedKeys.humidity, humHandler);
      };
    },
    cancel() {
      if (inactivityTimer !== null) clearTimeout(inactivityTimer);
      setSensorStatus("OFFLINE");
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
