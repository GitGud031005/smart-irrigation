/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../lib/prisma'
import type { Zone } from '../lib/generated/prisma/client'

export async function createZone(data: { name: string; userId?: bigint | number; profileId?: bigint | number; scheduleId?: bigint | number }): Promise<Zone> {
	if (data.scheduleId) {
		const existing = await prisma.zone.findFirst({ where: { scheduleId: BigInt(data.scheduleId) } })
		if (existing) throw new Error('Schedule already assigned to another zone')
	}
	const payload: any = { name: data.name }
	if (data.userId) payload.userId = BigInt(data.userId)
	if (data.profileId) payload.profileId = BigInt(data.profileId)
	if (data.scheduleId) payload.scheduleId = BigInt(data.scheduleId)
	return prisma.zone.create({ data: payload })
}

export async function getZone(id: bigint | number): Promise<Zone | null> {
	return prisma.zone.findUnique({ where: { id: BigInt(id) } })
}

export async function listZones(): Promise<Zone[]> {
	return prisma.zone.findMany()
}

export async function updateZone(id: bigint | number, data: Partial<{ name: string; userId: bigint | number | null; profileId: bigint | number | null; scheduleId: bigint | number | null; currentMoisture: number; currentHumidity: number; currentTemperature: number }>): Promise<Zone> {
	if (data.scheduleId !== undefined && data.scheduleId !== null) {
		const exists = await prisma.zone.findFirst({ where: { scheduleId: BigInt(data.scheduleId), NOT: { id: BigInt(id) } } })
		if (exists) throw new Error('Schedule already assigned to another zone')
	}
	const payload: any = {}
	if (data.name !== undefined) payload.name = data.name
	if (data.userId !== undefined) payload.userId = data.userId === null ? null : BigInt(data.userId)
	if (data.profileId !== undefined) payload.profileId = data.profileId === null ? null : BigInt(data.profileId)
	if (data.scheduleId !== undefined) payload.scheduleId = data.scheduleId === null ? null : BigInt(data.scheduleId)
	if (data.currentMoisture !== undefined) payload.currentMoisture = data.currentMoisture
	if (data.currentHumidity !== undefined) payload.currentHumidity = data.currentHumidity
	if (data.currentTemperature !== undefined) payload.currentTemperature = data.currentTemperature
	return prisma.zone.update({ where: { id: BigInt(id) }, data: payload })
}

export async function deleteZone(id: bigint | number): Promise<Zone> {
	return prisma.zone.delete({ where: { id: BigInt(id) } })
}

