// GET /api/sensor-readings/stream — SSE endpoint for live sensor readings
// Subscribes to Adafruit IO MQTT feeds server-side and pushes new combined readings
// to the browser via Server-Sent Events whenever all 3 metrics are buffered.

import { subscribeToFeed, unsubscribeFromFeed } from "@/lib/mqtt";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const buffer = {
    soilMoisture: null as number | null,
    temperature: null as number | null,
    humidity: null as number | null,
  };

  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const feedKeys = {
        soilMoisture: process.env.ADAFRUIT_IO_FEED_SOIL_MOISTURE || "soil",
        temperature: process.env.ADAFRUIT_IO_FEED_TEMPERATURE || "temperature",
        humidity: process.env.ADAFRUIT_IO_FEED_HUMIDITY || "humidity",
      };

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
