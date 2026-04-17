// POST /api/ai/irrigation — AI-driven irrigation recommendation (FR10)
//
// Called by the IoT gateway (authenticated via X-API-Key).
// Gateway supplies: zoneId + GPS coordinates.
//
// The route:
//   1. Loads the zone's irrigation profile (min/max moisture thresholds).
//   2. Collects the last 24 h sensor readings (temps, hums, moists arrays).
//   3. Calls the external AI service to get `amount_pct` + `scheduled_at_abs`.
//   4. Converts `amount_pct` → `duration_seconds` using the historical
//      irrigation efficiency: how many moisture-% does one second of watering
//      deliver on average, derived from past IrrigationEvent records + nearest
//      SensorReading snapshots.
//   5. Returns { scheduled_at, duration_seconds } to the gateway.

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyApiKey } from "@/lib/api-key";

export const dynamic = "force-dynamic";

/** Fallback rate when there is no historical efficiency data.  1 % per 2 s. */
const FALLBACK_RATE_PCT_PER_S = 0.5;

/** URL of the external AI irrigation service. */
const AI_SERVICE_URL = "https://lamminhtungquan-weather-forecast.hf.space/auto-irrigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AiServiceResponse {
  amount_pct: number;
  scheduled_at_abs: string;
}

// ─── Duration conversion ──────────────────────────────────────────────────────

/**
 * Derives the average irrigation efficiency (moisture % delivered per second)
 * from completed IrrigationEvents paired with before/after SensorReadings.
 *
 * For each event with a known duration:
 *   - find the reading closest to (and ≤) startTime  → moisture_before
 *   - find the reading closest to (and ≥) endTime    → moisture_after
 *   - rate = (moisture_after - moisture_before) / duration
 *
 * Only positive deltas (i.e. moisture actually increased) are counted.
 * Returns FALLBACK_RATE_PCT_PER_S when there is no usable history.
 */
async function deriveEfficiencyRate(zoneId: string): Promise<number> {
  // Look back 30 days for enough historical events
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const events = await prisma.irrigationEvent.findMany({
    where: {
      zoneId,
      duration: { gt: 0 },
      endTime: { not: null },
      startTime: { gte: since },
    },
    orderBy: { startTime: "desc" },
    take: 20,
  });

  if (events.length === 0) return FALLBACK_RATE_PCT_PER_S;

  const rates: number[] = [];

  /** Max gap between the irrigation boundary and its paired sensor reading. */
  const READING_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

  for (const event of events) {
    const endTime = event.endTime!;

    // Closest reading in the 10-min window ending at startTime
    const readingBefore = await prisma.sensorReading.findFirst({
      where: {
        zoneId,
        soilMoisture: { not: null },
        recordedAt: {
          gte: new Date(event.startTime.getTime() - READING_WINDOW_MS),
          lte: event.startTime,
        },
      },
      orderBy: { recordedAt: "desc" },
    });

    // Closest reading in the 10-min window starting at endTime
    const readingAfter = await prisma.sensorReading.findFirst({
      where: {
        zoneId,
        soilMoisture: { not: null },
        recordedAt: {
          gte: endTime,
          lte: new Date(endTime.getTime() + READING_WINDOW_MS),
        },
      },
      orderBy: { recordedAt: "asc" },
    });

    if (
      readingBefore?.soilMoisture != null &&
      readingAfter?.soilMoisture != null &&
      event.duration! > 0
    ) {
      const delta = readingAfter.soilMoisture - readingBefore.soilMoisture;
      if (delta > 0) {
        rates.push(delta / event.duration!);
      }
    }
  }

  if (rates.length === 0) return FALLBACK_RATE_PCT_PER_S;

  const avgRate = rates.reduce((sum, r) => sum + r, 0) / rates.length;
  return avgRate;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = verifyApiKey(request);
  if (!auth.ok) return auth.error;

  // Parse body
  let body: { zoneId?: unknown; lat?: unknown; lon?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { zoneId, lat, lon } = body;
  if (typeof zoneId !== "string" || !zoneId) {
    return NextResponse.json({ error: "zoneId is required" }, { status: 400 });
  }
  if (typeof lat !== "number" || typeof lon !== "number") {
    return NextResponse.json({ error: "lat and lon (numbers) are required" }, { status: 400 });
  }

  // ── 1. Load zone + profile ─────────────────────────────────────────────────
  const zone = await prisma.zone.findUnique({
    where: { id: zoneId },
    include: { profile: true },
  });

  if (!zone) {
    return NextResponse.json({ error: "Zone not found" }, { status: 404 });
  }

  const minMoisture = zone.profile?.minMoisture ?? 30;
  const maxMoisture = zone.profile?.maxMoisture ?? 70;

  // ── 2. Collect last 24 h sensor readings ───────────────────────────────────
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const readings = await prisma.sensorReading.findMany({
    where: { zoneId, recordedAt: { gte: since24h } },
    orderBy: { recordedAt: "asc" },
  });

  // Extract non-null arrays; keep up to the last 50 entries each to stay within
  // reasonable payload size for the AI service.
  const temps  = readings.filter((r) => r.temperature  != null).map((r) => r.temperature!).slice(-50);
  const hums   = readings.filter((r) => r.humidity     != null).map((r) => r.humidity!).slice(-50);
  const moists = readings.filter((r) => r.soilMoisture != null).map((r) => r.soilMoisture!).slice(-50);

  // The AI service requires at least one data point in each array.
  if (temps.length === 0 || hums.length === 0 || moists.length === 0) {
    return NextResponse.json(
      { error: "Insufficient sensor data for the last 24 h (need at least one temp, humidity, and moisture reading)" },
      { status: 422 },
    );
  }

  // ── 3. Call the AI service ─────────────────────────────────────────────────
  const aiPayload = {
    zone:         zone.name,
    lat,
    lon,
    min_moisture: minMoisture,
    max_moisture: maxMoisture,
    temps,
    hums,
    moists,
  };

  let aiResult: AiServiceResponse;
  try {
    const aiResponse = await fetch(AI_SERVICE_URL, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(aiPayload),
      // Timeout via AbortSignal (10 s) — HF spaces can be slow to cold-start
      signal: AbortSignal.timeout(10_000),
    });

    if (!aiResponse.ok) {
      const text = await aiResponse.text().catch(() => "(no body)");
      console.error(`[AI Irrigation] service returned ${aiResponse.status}: ${text}`);
      return NextResponse.json(
        { error: `AI service error: ${aiResponse.status}` },
        { status: 502 },
      );
    }

    aiResult = (await aiResponse.json()) as AiServiceResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[AI Irrigation] fetch failed:", message);
    return NextResponse.json({ error: `Failed to reach AI service: ${message}` }, { status: 502 });
  }

  const { amount_pct, scheduled_at_abs } = aiResult;

  // AI service may return null scheduled_at_abs when no irrigation is needed
  // or when it cannot produce a recommendation. In that case skip irrigation
  // this cycle and tell the gateway to try again in 1 hour.
  if (!scheduled_at_abs) {
    const nextHour = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    return NextResponse.json({ scheduled_at: nextHour, duration_seconds: 0 });
  }

  if (typeof amount_pct !== "number") {
    return NextResponse.json({ error: "Unexpected AI service response shape" }, { status: 502 });
  }

  // ── 4. Convert amount_pct → duration_seconds ───────────────────────────────
  const efficiencyRate = await deriveEfficiencyRate(zoneId); // % per second
  const durationSeconds = Math.max(1, Math.round(amount_pct / efficiencyRate));

  // ── 5. Return to the gateway ───────────────────────────────────────────────
  return NextResponse.json({
    scheduled_at:     scheduled_at_abs,
    duration_seconds: durationSeconds,
  });
}
