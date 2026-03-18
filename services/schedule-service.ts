import prisma from '../lib/prisma'
import type { Schedule } from '../lib/generated/prisma/client'

export async function createSchedule(data: { cronExpression: string; isActive?: boolean }): Promise<Schedule> {
	return prisma.schedule.create({ data })
}

export async function getSchedule(id: bigint | number): Promise<Schedule | null> {
	return prisma.schedule.findUnique({ where: { id: BigInt(id) } })
}

export async function listSchedules(): Promise<Schedule[]> {
	return prisma.schedule.findMany()
}

export async function updateSchedule(id: bigint | number, data: Partial<{ cronExpression: string; isActive: boolean }>): Promise<Schedule> {
	return prisma.schedule.update({ where: { id: BigInt(id) }, data })
}

export async function deleteSchedule(id: bigint | number): Promise<Schedule> {
	const zoneUsing = await prisma.zone.findFirst({ where: { scheduleId: BigInt(id) } })
	if (zoneUsing) throw new Error('Schedule is assigned to a zone')
	return prisma.schedule.delete({ where: { id: BigInt(id) } })
}

