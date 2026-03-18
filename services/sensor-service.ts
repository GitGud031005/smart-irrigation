/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../lib/prisma'
import type { Sensor, SensorReading } from '../lib/generated/prisma/client'

export async function createSensor(data: { sensorType?: string; modelName?: string; zoneId?: bigint | number }): Promise<Sensor> {
	const payload: any = {}
	if (data.sensorType) payload.sensorType = data.sensorType
	if (data.modelName) payload.modelName = data.modelName
	if (data.zoneId) payload.zoneId = BigInt(data.zoneId)
	return prisma.sensor.create({ data: payload })
}

export async function getSensor(id: bigint | number): Promise<Sensor | null> {
	return prisma.sensor.findUnique({ where: { id: BigInt(id) } })
}

export async function listSensors(): Promise<Sensor[]> {
	return prisma.sensor.findMany()
}

export async function updateSensor(id: bigint | number, data: Partial<{ sensorType: string; modelName: string; zoneId: bigint | number | null }>): Promise<Sensor> {
	const payload: any = {}
	if (data.sensorType !== undefined) payload.sensorType = data.sensorType
	if (data.modelName !== undefined) payload.modelName = data.modelName
	if (data.zoneId !== undefined) payload.zoneId = data.zoneId === null ? null : BigInt(data.zoneId)
	return prisma.sensor.update({ where: { id: BigInt(id) }, data: payload })
}

export async function deleteSensor(id: bigint | number): Promise<Sensor> {
	return prisma.sensor.delete({ where: { id: BigInt(id) } })
}

export async function listSensorReadings(sensorId: bigint | number, opts?: { take?: number }): Promise<SensorReading[]> {
	const q: any = { where: { sensorId: BigInt(sensorId) }, orderBy: { recordedAt: 'desc' } }
	if (opts?.take) q.take = opts.take
	return prisma.sensorReading.findMany(q)
}

