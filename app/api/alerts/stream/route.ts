// GET /api/alerts/stream — SSE endpoint for live audit-log events.
// Subscribes to the user's `audit-log` Adafruit IO MQTT feed server-side.
// Each message published by the gateway is:
//   1. Persisted as an Alert row in the DB.
//   2. Streamed to the browser as an SSE event so the audit-logs page
//      can display it without a page refresh.
//
// Expected MQTT payload (JSON string):
//   { "message": "...", "severity": "INFO"|"WARNING"|"CRITICAL",
//     "type": "DEVICE_STATUS"|"PLANT_STATUS"|"IRRIGATION_EVENT",
//     "actor": "USER"|"SYSTEM"|"AI", "zoneId": "<optional uuid>" }
// Plain-text payloads are also accepted and stored as INFO/DEVICE_STATUS/SYSTEM.

import { NextRequest } from "next/server";
import { subscribeToFeed, unsubscribeFromFeed } from "@/lib/mqtt";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { getUserById } from "@/services/auth-service";
import { createAlert, getAlert } from "@/services/alert-service";
import { AlertFactory } from "@/lib/factories/alert-factory";

export const dynamic = "force-dynamic";

/** The Adafruit IO feed key that the IoT gateway publishes audit events to. */
const AUDIT_FEED_KEY = "audit-log";

export async function GET(request: NextRequest) {
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
  if (!dbUser?.adafruitUsername || !dbUser?.adafruitKey) {
    return new Response(
      JSON.stringify({ error: "Adafruit IO credentials not configured" }),
      { status: 422, headers: { "Content-Type": "application/json" } }
    );
  }
  const credentials = { username: dbUser.adafruitUsername, key: dbUser.adafruitKey };

  const encoder = new TextEncoder();
  let cleanup: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const emit = (data: object) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Client disconnected
        }
      };

      const handler = async (_feedKey: string, raw: string) => {
        const parsed = AlertFactory.fromMqttPayload(raw);
        const alertIdFromPayload: string | undefined = (() => {
          try { return JSON.parse(raw)?.alertId ?? undefined; } catch { return undefined; }
        })();

        // If the server already persisted this alert (pump route / healthcheck),
        // reuse it — don't create a duplicate.
        let saved: { id: string; createdAt: Date | string };
        try {
          if (alertIdFromPayload) {
            saved = (await getAlert(alertIdFromPayload)) ?? { id: alertIdFromPayload, createdAt: new Date() };
          } else {
            saved = await createAlert(parsed);
          }
        } catch {
          saved = { id: `live-${Date.now()}`, createdAt: new Date() };
        }

        emit({
          type: "audit",
          id:        saved.id,
          createdAt: saved.createdAt instanceof Date
            ? saved.createdAt.toISOString()
            : String(saved.createdAt),
          message:   parsed.message,
          severity:  parsed.severity,
          alertType: parsed.type,
          actor:     parsed.actor,
          zoneId:    parsed.zoneId ?? null,
        });
      };

      subscribeToFeed(credentials, AUDIT_FEED_KEY, handler);

      // Send an initial heartbeat so the client knows the connection is live
      emit({ type: "connected" });

      cleanup = () => unsubscribeFromFeed(credentials, AUDIT_FEED_KEY, handler);
    },
    cancel() {
      cleanup?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection:      "keep-alive",
    },
  });
}
