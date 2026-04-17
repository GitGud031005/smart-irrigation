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

  // Sync all zones for all users concurrently; never let one failure abort the rest
  const results = await Promise.allSettled(
    users.flatMap((user) =>
      user.zones.map((zone) =>
        syncZoneSensorReadings(zone.id, {
          username: user.adafruitUsername,
          key: user.adafruitKey,
        }),
      ),
    ),
  );

  let totalInserted = 0;
  const errors: string[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      totalInserted += result.value.inserted;
      if (result.value.skipped) {
        console.warn(`[SyncCron] zone ${result.value.zoneId} skipped: ${result.value.skipped}`);
      }
    } else {
      const msg = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.error("[SyncCron] zone sync failed:", msg);
      errors.push(msg);
    }
  }

  return NextResponse.json({
    synced:   results.length,
    inserted: totalInserted,
    errors:   errors.length > 0 ? errors : undefined,
  });
}
