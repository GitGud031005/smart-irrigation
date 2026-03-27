import prisma from '../lib/prisma'

const WITH_SLOTS = { timeSlots: true } as const

export async function listSchedules(userId: string) {
	return prisma.schedule.findMany({ where: { userId }, include: WITH_SLOTS, orderBy: { name: 'asc' } })
}

export async function getSchedule(id: string) {
	return prisma.schedule.findUnique({ where: { id }, include: WITH_SLOTS })
}

export async function createSchedule(data: {
	name: string
	userId: string
	timeSlots?: { startTime: string; days: string[]; duration: number }[]
}) {
	return prisma.schedule.create({
		data: {
			name: data.name,
			userId: data.userId,
			timeSlots: data.timeSlots?.length
				? { create: data.timeSlots.map((s) => ({ startTime: s.startTime, days: s.days, duration: s.duration })) }
				: undefined,
		},
		include: WITH_SLOTS,
	})
}

export async function updateSchedule(
	id: string,
	data: {
		name?: string
		timeSlots?: { startTime: string; days: string[]; duration: number }[]
	},
) {
	// Replace all timeslots when provided (delete + recreate approach)
	if (data.timeSlots !== undefined) {
		await prisma.timeSlot.deleteMany({ where: { scheduleId: id } })
	}
	return prisma.schedule.update({
		where: { id },
		data: {
			...(data.name !== undefined ? { name: data.name } : {}),
			...(data.timeSlots !== undefined
				? { timeSlots: { create: data.timeSlots.map((s) => ({ startTime: s.startTime, days: s.days, duration: s.duration })) } }
				: {}),
		},
		include: WITH_SLOTS,
	})
}

export async function deleteSchedule(id: string) {
	const zoneUsing = await prisma.zone.findFirst({ where: { scheduleId: id } })
	if (zoneUsing) throw new Error('Schedule is assigned to a zone')
	// Cascade delete handles timeslots
	return prisma.schedule.delete({ where: { id } })
}

