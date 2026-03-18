import prisma from '../lib/prisma'
import type { IrrigationEvent } from '../lib/generated/prisma/client'

export async function createIrrigationEvent(data: { zoneId?: bigint | number; startTime: Date; endTime?: Date | null; duration?: number; triggerType?: string }): Promise<IrrigationEvent> {
	return prisma.irrigationEvent.create({ data: { zoneId: data.zoneId ? BigInt(data.zoneId) : undefined, startTime: data.startTime, endTime: data.endTime, duration: data.duration, triggerType: data.triggerType } })
}

export async function getIrrigationEvent(id: bigint | number): Promise<IrrigationEvent | null> {
	return prisma.irrigationEvent.findUnique({ where: { id: BigInt(id) } })
}

export async function listIrrigationEvents(): Promise<IrrigationEvent[]> {
	return prisma.irrigationEvent.findMany({ orderBy: { startTime: 'desc' } })
}

export async function updateIrrigationEvent(id: bigint | number, data: Partial<{ endTime: Date | null; duration: number; triggerType: string }>): Promise<IrrigationEvent> {
	return prisma.irrigationEvent.update({ where: { id: BigInt(id) }, data })
}

export async function deleteIrrigationEvent(id: bigint | number): Promise<IrrigationEvent> {
	return prisma.irrigationEvent.delete({ where: { id: BigInt(id) } })
}

