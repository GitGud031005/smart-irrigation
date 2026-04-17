// GET /api/cron/sync-readings — Syncs Adafruit IO sensor feeds for every zone
// across all users.  Intended to be called by cron-job.org every minute so the
// DB is always up-to-date and the frontend sync only has to catch up on any
// small gap since the last cron run rather than pulling the full 24-hour window.
//
// Auth: Bearer <CRON_SECRET>  (same pattern as /api/cron/healthcheck)
// The frontend /api/sensor-readings/sync route is intentionally kept unchanged
// so it still works as a manual / on-demand fallback.

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { syncZoneSensorReadings } from "@/services/sensor-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Auth — same CRON_SECRET guard as healthcheck
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("Authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Load every user that has Adafruit credentials configured
  const users = await prisma.user.findMany({
    where: {
      adafruitUsername: { not: "" },
      adafruitKey: { not: "" },
    },
    select: {
      id: true,
      adafruitUsername: true,
      adafruitKey: true,
      zones: { select: { id: true } },
    },
  });

  if (users.length === 0) {
    return NextResponse.json({ synced: 0, message: "No users with Adafruit credentials." });
  }

  // Sync zones sequentially per user to stay within Adafruit IO rate limits
  // (concurrent requests from the same key can get throttled / connection-refused).
  let totalInserted = 0;
  const errors: string[] = [];
  let synced = 0;

  for (const user of users) {
    for (const zone of user.zones) {
      synced++;
      try {
        const result = await syncZoneSensorReadings(zone.id, {
          username: user.adafruitUsername,
          key: user.adafruitKey,
        });
        totalInserted += result.inserted;
        if (result.skipped) {
          console.warn(`[SyncCron] zone ${result.zoneId} skipped: ${result.skipped}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[SyncCron] zone sync failed:", msg);
        errors.push(`zone ${zone.id}: ${msg}`);
      }
    }
  }

  return NextResponse.json({
    synced,
    inserted: totalInserted,
    errors:   errors.length > 0 ? errors : undefined,
  });
}
