/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../lib/prisma'
import type { Zone } from '../lib/generated/prisma/client'

export async function createZone(data: { name: string; userId?: string; profileId?: string; scheduleId?: string }): Promise<Zone> {
	if (!data.userId) {
		throw new Error('userId is required')
	}
	if (data.scheduleId) {
		const existing = await prisma.zone.findFirst({ where: { scheduleId: data.scheduleId } })
		if (existing) throw new Error('Schedule already assigned to another zone')
	}
	const payload: any = { name: data.name }
	if (data.userId) payload.userId = data.userId
	if (data.profileId) payload.profileId = data.profileId
	if (data.scheduleId) payload.scheduleId = data.scheduleId
	return prisma.zone.create({ data: payload })
}

export async function getZone(id: string): Promise<Zone | null> {
	return prisma.zone.findUnique({ where: { id } })
}

export async function listZones(userId?: string): Promise<Zone[]> {
  if (!userId) {
    throw new Error("userId is required");
  }
  return prisma.zone.findMany({ where: { userId } });
}

export async function updateZone(id: string, data: Partial<{ name: string; userId: string | null; profileId: string | null; scheduleId: string | null }>): Promise<Zone> {
	if (data.scheduleId !== undefined && data.scheduleId !== null) {
		const exists = await prisma.zone.findFirst({ where: { scheduleId: data.scheduleId, NOT: { id } } })
		if (exists) throw new Error('Schedule already assigned to another zone')
	}
	const payload: any = {}
	if (data.name !== undefined) payload.name = data.name
	if (data.userId !== undefined) payload.userId = data.userId
	if (data.profileId !== undefined) payload.profileId = data.profileId
	if (data.scheduleId !== undefined) payload.scheduleId = data.scheduleId
	return prisma.zone.update({ where: { id }, data: payload })
}

export async function deleteZone(id: string): Promise<Zone> {
	return prisma.zone.delete({ where: { id } })
}

