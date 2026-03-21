/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../lib/prisma'
import type { SensorReading } from '../lib/generated/prisma/client'

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

