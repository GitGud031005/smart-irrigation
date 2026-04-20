// GET /api/devices/relay/stream?zoneId=<id>
// SSE endpoint that subscribes to the relay device's Adafruit IO MQTT feed and
// pushes pump state changes to the browser in real-time.
// Payload: { type: "pump", status: "ACTIVE" | "OFFLINE" }
// Also emits the current DB state immediately on connect so the client can
// initialise without waiting for the next MQTT message.

import { NextRequest } from "next/server";
import { subscribeToFeed, unsubscribeFromFeed } from "@/lib/mqtt";
import { getDeviceInZone } from "@/services/device-service";
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

  // Auth
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const dbUser = await getUserById(payload.userId);
  if (!dbUser || !dbUser.adafruitUsername || !dbUser.adafruitKey) {
    return new Response(JSON.stringify({ error: "Adafruit IO credentials not configured" }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }
  const credentials = { username: dbUser.adafruitUsername, key: dbUser.adafruitKey };

  const zone = await getZone(zoneId);
  if (!zone) {
    return new Response(JSON.stringify({ error: "Zone not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const relayDevice = await getDeviceInZone(zoneId, "RELAY_MODULE");
  if (!relayDevice?.feedKey) {
    return new Response(
      JSON.stringify({ error: "Relay device in this zone is missing feed key configuration" }),
      { status: 422, headers: { "Content-Type": "application/json" } },
    );
  }

  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const emit = (payload: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        } catch {
          // Stream already closed — client disconnected
        }
      };

      // Emit the current DB state immediately so the client doesn't have to
      // wait for the next MQTT message to know the pump's current status.
      emit({ type: "pump", status: relayDevice.status ?? "OFFLINE" });

      const handler = (_feedKey: string, value: string) => {
        // Adafruit relay feed: "1" → pump on, "0" → pump off
        const status = value.trim() === "1" ? "ACTIVE" : "OFFLINE";
        emit({ type: "pump", status });
      };

      const feedKey = relayDevice.feedKey!;
      subscribeToFeed(credentials, feedKey, handler);
      cleanup = () => unsubscribeFromFeed(credentials, feedKey, handler);
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
