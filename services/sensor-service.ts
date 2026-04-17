/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../lib/prisma'
import type { SensorReading } from '../lib/generated/prisma/client'
import { getFeedData } from '@/lib/adafruit-io'
import { getDeviceInZone } from '@/services/device-service'

// ─── SensorReading CRUD ───────────────────────────────────────────────────────

export async function createSensorReading(data: { zoneId?: string; soilMoisture?: number; temperature?: number; humidity?: number; recordedAt?: Date }): Promise<SensorReading> {
	const payload: any = {}
	if (data.zoneId) payload.zoneId = data.zoneId
	if (data.soilMoisture !== undefined) payload.soilMoisture = data.soilMoisture
	if (data.temperature !== undefined) payload.temperature = data.temperature
	if (data.humidity !== undefined) payload.humidity = data.humidity
	if (data.recordedAt) payload.recordedAt = data.recordedAt
	return prisma.sensorReading.create({ data: payload })
}

export async function getSensorReading(id: string): Promise<SensorReading | null> {
	return prisma.sensorReading.findUnique({ where: { id } })
}

export async function querySensorReadings(opts?: { zoneId?: string; since?: Date; until?: Date; take?: number }): Promise<SensorReading[]> {
	const where: any = {}
	if (opts?.zoneId) where.zoneId = opts.zoneId
	if (opts?.since || opts?.until) where.recordedAt = {}
	if (opts?.since) where.recordedAt.gte = opts.since
	if (opts?.until) where.recordedAt.lte = opts.until
	return prisma.sensorReading.findMany({ where, orderBy: { recordedAt: 'desc' }, take: opts?.take })
}

export async function updateSensorReading(id: string, data: Partial<{ soilMoisture: number; temperature: number; humidity: number }>): Promise<SensorReading> {
	return prisma.sensorReading.update({ where: { id }, data })
}

export async function deleteSensorReading(id: string): Promise<SensorReading> {
	return prisma.sensorReading.delete({ where: { id } })
}

export async function getLatestSensorReading(zoneId?: string): Promise<SensorReading | null> {
  const lastReading = await prisma.sensorReading.findFirst({
    where: zoneId ? { zoneId: zoneId } : undefined,
    
    orderBy: {
      recordedAt: 'desc', 
    },
  });

  return lastReading; 
}

export async function createSensorReadingsBatch(data: any[]) {
  const result = await prisma.sensorReading.createMany({
    data: data,
    skipDuplicates: true,
  });
  return result.count;
}

// ─── Zone sensor-feed sync (shared by the frontend and cron routes) ───────────

type MetricKey = "soilMoisture" | "temperature" | "humidity";

interface AdafruitDatum {
  value: string;
  created_at: string;
}

export interface SyncZoneResult {
  zoneId:   string;
  inserted: number;
  skipped?: string; // reason when the zone was skipped without error
}

/**
 * Pulls the three Adafruit IO sensor feeds for a zone and batch-inserts new
 * readings using a sliding-buffer strategy:
 *   - Only emits a DB row once all three metrics are present in the buffer.
 *   - Deduplicates against the latest stored reading (fetches only newer data).
 *   - Returns the number of rows inserted; `skipped` is set when devices are
 *     misconfigured rather than throwing so callers can handle it gracefully.
 */
export async function syncZoneSensorReadings(
  zoneId: string,
  credentials: { username: string; key: string },
): Promise<SyncZoneResult> {
  const [soilDevice, tempDevice, humDevice] = await Promise.all([
    getDeviceInZone(zoneId, "SOIL_MOISTURE_SENSOR"),
    getDeviceInZone(zoneId, "DHT20_TEMPERATURE_SENSOR"),
    getDeviceInZone(zoneId, "DHT20_HUMIDITY_SENSOR"),
  ]);

  if (!soilDevice?.feedKey || !tempDevice?.feedKey || !humDevice?.feedKey) {
    return { zoneId, inserted: 0, skipped: "missing feed keys" };
  }

  // Only fetch data newer than the last stored reading to avoid duplicates
  const lastStored = await getLatestSensorReading(zoneId).then(
    (r) => (r?.recordedAt ? new Date(r.recordedAt) : null),
  );
  const params = lastStored ? { start_time: lastStored.toISOString() } : undefined;

  const [soilData, tempData, humData] = await Promise.all([
    getFeedData(soilDevice.feedKey, credentials, params),
    getFeedData(tempDevice.feedKey, credentials, params),
    getFeedData(humDevice.feedKey, credentials, params),
  ]);

  type TaggedDatum = { metric: MetricKey; value: number; ts: Date };
  const tagged: TaggedDatum[] = [
    ...(soilData as AdafruitDatum[]).map((d) => ({ metric: "soilMoisture" as MetricKey, value: parseFloat(d.value), ts: new Date(d.created_at) })),
    ...(tempData as AdafruitDatum[]).map((d) => ({ metric: "temperature"  as MetricKey, value: parseFloat(d.value), ts: new Date(d.created_at) })),
    ...(humData  as AdafruitDatum[]).map((d) => ({ metric: "humidity"     as MetricKey, value: parseFloat(d.value), ts: new Date(d.created_at) })),
  ]
    .filter((d) => isFinite(d.value) && (!lastStored || d.ts > lastStored))
    .sort((a, b) => a.ts.getTime() - b.ts.getTime());

  if (tagged.length === 0) return { zoneId, inserted: 0 };

  // Sliding buffer: emit one DB row each time all three slots are filled
  const buffer: Record<MetricKey, number | null> = { soilMoisture: null, temperature: null, humidity: null };
  const toInsert: { soilMoisture: number; temperature: number; humidity: number; recordedAt: Date }[] = [];

  for (const datum of tagged) {
    buffer[datum.metric] = datum.value;
    if (buffer.soilMoisture !== null && buffer.temperature !== null && buffer.humidity !== null) {
      toInsert.push({
        soilMoisture: buffer.soilMoisture,
        temperature:  buffer.temperature,
        humidity:     buffer.humidity,
        recordedAt:   datum.ts,
      });
    }
  }

  if (toInsert.length === 0) return { zoneId, inserted: 0 };

  await Promise.all(toInsert.map((r) => createSensorReading({ ...r, zoneId })));
  return { zoneId, inserted: toInsert.length };
}

