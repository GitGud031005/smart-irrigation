import prisma from '../lib/prisma'
import type { IrrigationEvent } from '../lib/generated/prisma/client'

export async function createIrrigationEvent(data: { zoneId?: string; startTime: Date; endTime?: Date | null; duration?: number }): Promise<IrrigationEvent> {
	return prisma.irrigationEvent.create({ data: { zoneId: data.zoneId, startTime: data.startTime, endTime: data.endTime, duration: data.duration } })
}

export async function getIrrigationEvent(id: string): Promise<IrrigationEvent | null> {
	return prisma.irrigationEvent.findUnique({ where: { id } })
}

export async function listIrrigationEvents(): Promise<IrrigationEvent[]> {
	return prisma.irrigationEvent.findMany({ orderBy: { startTime: 'desc' } })
}

export async function updateIrrigationEvent(id: string, data: Partial<{ endTime: Date | null; duration: number }>): Promise<IrrigationEvent> {
	return prisma.irrigationEvent.update({ where: { id }, data })
}

export async function deleteIrrigationEvent(id: string): Promise<IrrigationEvent> {
	return prisma.irrigationEvent.delete({ where: { id } })
}

