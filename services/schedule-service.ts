import prisma from '../lib/prisma'
import type { Schedule } from '../lib/generated/prisma/client'

export async function createSchedule(data: { cronExpression: string }): Promise<Schedule> {
	return prisma.schedule.create({ data })
}

export async function getSchedule(id: string): Promise<Schedule | null> {
	return prisma.schedule.findUnique({ where: { id } })
}

export async function listSchedules(): Promise<Schedule[]> {
	return prisma.schedule.findMany()
}

export async function updateSchedule(id: string, data: Partial<{ cronExpression: string }>): Promise<Schedule> {
	return prisma.schedule.update({ where: { id }, data })
}

export async function deleteSchedule(id: string): Promise<Schedule> {
	const zoneUsing = await prisma.zone.findFirst({ where: { scheduleId: id } })
	if (zoneUsing) throw new Error('Schedule is assigned to a zone')
	return prisma.schedule.delete({ where: { id } })
}

