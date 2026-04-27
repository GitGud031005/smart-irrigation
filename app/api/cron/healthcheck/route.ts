// GET /api/cron/healthcheck — "The Reaper"
// Triggered every minute by Vercel Cron (vercel.json).
// Handles devices that powered off without updating their status (power shortage,
// network loss, etc.) by detecting stale heartbeats (lastActiveAt > 60 s ago).
//
// For each stale device the job:
//   1. Marks it OFFLINE in the DEVICE table.
//   2. Inserts a CRITICAL DEVICE_STATUS alert into the ALERT table.
//   3. Publishes that alert as JSON to the `audit-log` Adafruit IO MQTT feed
//      so the live audit-log SSE stream picks it up without a page refresh.

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { createAlert } from "@/services/alert-service";
import { connectMqtt } from "@/lib/mqtt";
import { AlertFactory, getDeviceLabel } from "@/lib/factories/alert-factory";
import { AuditPayloadFactory } from "@/lib/factories/audit-payload-factory";

export const dynamic = "force-dynamic";

/** Devices silent for longer than this are considered dead. */
const STALE_THRESHOLD_MS = 60_000; // 1 minute

/** Adafruit IO feed key that the audit-log SSE stream subscribes to. */
const AUDIT_FEED_KEY = "audit-log";

/** Publish a serialised JSON string to the audit-log feed. */
async function publishAuditToMqtt(message: string): Promise<void> {
  const username = process.env.ADAFRUIT_IO_USERNAME;
  const key = process.env.ADAFRUIT_IO_KEY;
  if (!username || !key) return;

  const credentials = { username, key };
  const mqttClient = connectMqtt(credentials);
  const topic = `${username}/feeds/${AUDIT_FEED_KEY}`;

  await new Promise<void>((resolve) => {
    // Timeout 3 giây phòng hờ MQTT không thể kết nối (bị chặn port)
    const fallbackTimeout = setTimeout(() => {
      mqttClient.end(); // Bắt buộc đóng socket
      console.error("[Reaper] MQTT Timeout");
      resolve();
    }, 3000);

    mqttClient.on("connect", () => {
      mqttClient.publish(topic, message, (err?: Error | null) => {
        clearTimeout(fallbackTimeout);
        if (err) console.error("[Reaper] MQTT publish failed:", err.message);

        mqttClient.end(); // DỌN DẸP CHIẾN TRƯỜNG: Đóng socket ngay lập tức
        resolve();
      });
    });

    mqttClient.on("error", (err) => {
      clearTimeout(fallbackTimeout);
      console.error("[Reaper] MQTT Error:", err);
      mqttClient.end();
      resolve();
    });
  });
}

export async function GET(request: NextRequest) {
  // Protect with CRON_SECRET when set (Vercel passes it automatically)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

  // Find ACTIVE devices whose last heartbeat is older than the threshold
  const staleDevices = await prisma.device.findMany({
    where: { status: "ACTIVE", lastActiveAt: { lt: cutoff } },
  });

  if (staleDevices.length === 0) {
    console.log("[Reaper] All devices healthy.");
    return NextResponse.json({ swept: 0, message: "All devices are healthy." });
  }

  // Bulk-mark stale devices as OFFLINE
  await prisma.device.updateMany({
    where: { id: { in: staleDevices.map((d) => d.id) } },
    data:  { status: "OFFLINE" },
  });

  // For each stale device: persist alert + publish to MQTT
  const results = await Promise.allSettled(
    staleDevices.map(async (device) => {
      const label    = getDeviceLabel(device.deviceType, device.id);
      const lastSeen = device.lastActiveAt ? device.lastActiveAt.toISOString() : "unknown";
      const alertInput = AlertFactory.deviceOffline(
        `${label} lost connection (last seen: ${lastSeen})`,
        device.zoneId,
      );

      // 1. Persist alert to DB
      const alert = await createAlert(alertInput);

      // 2. Publish to Adafruit IO audit-log feed so the live SSE stream picks it up
      const payload = AuditPayloadFactory.fromAlert(alertInput, alert.createdAt, alert.id);
      await publishAuditToMqtt(AuditPayloadFactory.serialize(payload));

      console.log(`[Reaper] Swept ${device.id} (${alertInput.message})`);
      return device.id;
    })
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed    = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({
    swept:     staleDevices.length,
    succeeded,
    failed,
    deviceIds: staleDevices.map((d) => d.id),
  });
}
