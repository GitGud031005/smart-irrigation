/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../lib/prisma'
import type { Sensor, SensorReading } from '../lib/generated/prisma/client'

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

export async function listSensorReadings(sensorId: string, opts?: { take?: number }): Promise<SensorReading[]> {
	const q: any = { where: { sensorId }, orderBy: { recordedAt: 'desc' } }
	if (opts?.take) q.take = opts.take
	return prisma.sensorReading.findMany(q)
}

