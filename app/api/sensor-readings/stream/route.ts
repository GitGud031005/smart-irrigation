// GET /api/sensor-readings/stream?zoneId=<id> — SSE endpoint for live sensor readings.
// Flow: zone → devices in zone by type → feedKey → MQTT subscription
// Subscribes to Adafruit IO MQTT feeds server-side and pushes new combined readings
// to the browser via Server-Sent Events whenever all 3 metrics are buffered.

import { NextRequest } from "next/server";
import { subscribeToFeed, unsubscribeFromFeed } from "@/lib/mqtt";
import { getDeviceInZone } from "@/services/device-service";
import { getZone } from "@/services/zone-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const zoneId = request.nextUrl.searchParams.get("zoneId");
  if (!zoneId) {
    return new Response(JSON.stringify({ error: "zoneId query parameter is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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

  const encoder = new TextEncoder();

  const buffer = {
    soilMoisture: null as number | null,
    temperature: null as number | null,
    humidity: null as number | null,
  };

  let cleanup: (() => void) | null = null;

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

      subscribeToFeed(feedKeys.soilMoisture, soilHandler);
      subscribeToFeed(feedKeys.temperature, tempHandler);
      subscribeToFeed(feedKeys.humidity, humHandler);

      cleanup = () => {
        unsubscribeFromFeed(feedKeys.soilMoisture, soilHandler);
        unsubscribeFromFeed(feedKeys.temperature, tempHandler);
        unsubscribeFromFeed(feedKeys.humidity, humHandler);
      };
    },
    cancel() {
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
