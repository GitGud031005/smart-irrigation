// POST /api/sensor-readings/sync — Polls all three Adafruit feeds for new data and batch-inserts
// readings into the DB using a sliding buffer strategy:
// - A reading is only created once all 3 metrics (soilMoisture, temperature, humidity) are present.
// - Whenever any metric updates, a new reading is emitted using the current buffer values.
// - recordedAt is always the timestamp of the most recent event that triggered the emission.

import { NextRequest, NextResponse } from "next/server";
import { syncZoneSensorReadings } from "@/services/sensor-service";
import { getZone } from "@/services/zone-service";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { getUserById } from "@/services/auth-service";

export async function POST(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const payload = await verifyToken(token)
  if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const dbUser = await getUserById(payload.userId)
  if (!dbUser || !dbUser.adafruitUsername || !dbUser.adafruitKey) {
    return NextResponse.json({ error: 'Adafruit IO credentials not configured. Please set them in the header settings.' }, { status: 422 })
  }
  const credentials = { username: dbUser.adafruitUsername, key: dbUser.adafruitKey }

  let body: { zoneId?: string } = {}
  try { body = await request.json() } catch { /* body is optional */ }

  const zoneId = body.zoneId
  if (!zoneId) return NextResponse.json({ error: 'zoneId is required in the request body' }, { status: 400 })

  const zone = await getZone(zoneId)
  if (!zone) return NextResponse.json({ error: 'Zone not found' }, { status: 404 })

  try {
    const result = await syncZoneSensorReadings(zoneId, credentials)

    if (result.skipped) {
      return NextResponse.json(
        { error: "Sensor devices in this zone are missing feed key configuration" },
        { status: 422 },
      )
    }

    if (result.inserted === 0) {
      return NextResponse.json({ inserted: 0, message: "No new data from any feed." })
    }

    return NextResponse.json({ inserted: result.inserted })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

