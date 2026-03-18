/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../lib/prisma'
import type { SensorReading, IrrigationEvent } from '../lib/generated/prisma/client'

export async function logSensorReading(data: { sensorId?: bigint | number; soilMoisture?: number; temperature?: number; humidity?: number }): Promise<SensorReading> {
	const payload: any = {}
	if (data.sensorId) payload.sensorId = BigInt(data.sensorId)
	if (data.soilMoisture !== undefined) payload.soilMoisture = data.soilMoisture
	if (data.temperature !== undefined) payload.temperature = data.temperature
	if (data.humidity !== undefined) payload.humidity = data.humidity
	return prisma.sensorReading.create({ data: payload })
}

export async function querySensorReadings(opts?: { sensorId?: bigint | number; zoneId?: bigint | number; since?: Date; until?: Date; take?: number }): Promise<SensorReading[]> {
	if (opts?.zoneId) {
		return prisma.sensorReading.findMany({ where: { sensor: { zoneId: BigInt(opts.zoneId) } }, orderBy: { recordedAt: 'desc' }, take: opts?.take })
	}
	const where: any = {}
	if (opts?.sensorId) where.sensorId = BigInt(opts.sensorId)
	if (opts?.since || opts?.until) where.recordedAt = {}
	if (opts?.since) where.recordedAt.gte = opts.since
	if (opts?.until) where.recordedAt.lte = opts.until
	return prisma.sensorReading.findMany({ where, orderBy: { recordedAt: 'desc' }, take: opts?.take })
}

export async function logIrrigationEvent(data: { zoneId?: bigint | number; startTime: Date; endTime?: Date | null; duration?: number; triggerType?: string }): Promise<IrrigationEvent> {
	const payload: any = { startTime: data.startTime }
	if (data.zoneId) payload.zoneId = BigInt(data.zoneId)
	if (data.endTime !== undefined) payload.endTime = data.endTime
	if (data.duration !== undefined) payload.duration = data.duration
	if (data.triggerType !== undefined) payload.triggerType = data.triggerType
	return prisma.irrigationEvent.create({ data: payload })
}

export async function queryIrrigationEvents(opts?: { zoneId?: bigint | number; since?: Date; until?: Date; take?: number }): Promise<IrrigationEvent[]> {
	const where: any = {}
	if (opts?.zoneId) where.zoneId = BigInt(opts.zoneId)
	if (opts?.since || opts?.until) where.startTime = {}
	if (opts?.since) where.startTime.gte = opts.since
	if (opts?.until) where.startTime.lte = opts.until
	return prisma.irrigationEvent.findMany({ where, orderBy: { startTime: 'desc' }, take: opts?.take })
}

