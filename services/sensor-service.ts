/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../lib/prisma'
import type { Sensor, SensorReading } from '../lib/generated/prisma/client'

// ─── Sensor CRUD ─────────────────────────────────────────────────────────────

export async function createSensor(data: { sensorType?: string; modelName?: string; zoneId?: string }): Promise<Sensor> {
	const payload: any = {}
	if (data.sensorType) payload.sensorType = data.sensorType
	if (data.modelName) payload.modelName = data.modelName
	if (data.zoneId) payload.zoneId = data.zoneId
	return prisma.sensor.create({ data: payload })
}

export async function getSensor(id: string): Promise<Sensor | null> {
	return prisma.sensor.findUnique({ where: { id } })
}

export async function listSensors(): Promise<Sensor[]> {
	return prisma.sensor.findMany()
}

export async function updateSensor(id: string, data: Partial<{ sensorType: string; modelName: string; zoneId: string | null }>): Promise<Sensor> {
	const payload: any = {}
	if (data.sensorType !== undefined) payload.sensorType = data.sensorType
	if (data.modelName !== undefined) payload.modelName = data.modelName
	if (data.zoneId !== undefined) payload.zoneId = data.zoneId
	return prisma.sensor.update({ where: { id }, data: payload })
}

export async function deleteSensor(id: string): Promise<Sensor> {
	return prisma.sensor.delete({ where: { id } })
}

// ─── SensorReading CRUD ───────────────────────────────────────────────────────

export async function createSensorReading(data: { sensorId?: string; soilMoisture?: number; temperature?: number; humidity?: number; recordedAt?: Date }): Promise<SensorReading> {
	const payload: any = {}
	if (data.sensorId) payload.sensorId = data.sensorId
	if (data.soilMoisture !== undefined) payload.soilMoisture = data.soilMoisture
	if (data.temperature !== undefined) payload.temperature = data.temperature
	if (data.humidity !== undefined) payload.humidity = data.humidity
	if (data.recordedAt) payload.recordedAt = data.recordedAt
	return prisma.sensorReading.create({ data: payload })
}

export async function getSensorReading(id: string): Promise<SensorReading | null> {
	return prisma.sensorReading.findUnique({ where: { id } })
}

export async function querySensorReadings(opts?: { sensorId?: string; zoneId?: string; since?: Date; until?: Date; take?: number }): Promise<SensorReading[]> {
	if (opts?.zoneId) {
		return prisma.sensorReading.findMany({ where: { sensor: { zoneId: opts.zoneId } }, orderBy: { recordedAt: 'desc' }, take: opts?.take })
	}
	const where: any = {}
	if (opts?.sensorId) where.sensorId = opts.sensorId
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

/** Returns the recordedAt of the most recent reading where the given field is not null. */
export async function getLatestReadingTimestamp(field: 'soilMoisture' | 'temperature' | 'humidity'): Promise<Date | null> {
	const row = await prisma.sensorReading.findFirst({
		where: { [field]: { not: null } },
		orderBy: { recordedAt: 'desc' },
		select: { recordedAt: true },
	})
	return row?.recordedAt ?? null
}

