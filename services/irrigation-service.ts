/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../lib/prisma'
import type { IrrigationEvent } from '../lib/generated/prisma/client'

// ─── IrrigationEvent CRUD ─────────────────────────────────────────────────────

export async function createIrrigationEvent(data: { zoneId?: string; startTime: Date; endTime?: Date | null; duration?: number }): Promise<IrrigationEvent> {
	const payload: any = { startTime: data.startTime }
	if (data.zoneId) payload.zoneId = data.zoneId
	if (data.endTime !== undefined) payload.endTime = data.endTime
	if (data.duration !== undefined) payload.duration = data.duration
	return prisma.irrigationEvent.create({ data: payload })
}

export async function getIrrigationEvent(id: string): Promise<IrrigationEvent | null> {
	return prisma.irrigationEvent.findUnique({ where: { id } })
}

export async function queryIrrigationEvents(opts?: { zoneId?: string; since?: Date; until?: Date; take?: number }): Promise<IrrigationEvent[]> {
	const where: any = {}
	if (opts?.zoneId) where.zoneId = opts.zoneId
	if (opts?.since || opts?.until) where.startTime = {}
	if (opts?.since) where.startTime.gte = opts.since
	if (opts?.until) where.startTime.lte = opts.until
	return prisma.irrigationEvent.findMany({ where, orderBy: { startTime: 'desc' }, take: opts?.take })
}

export async function updateIrrigationEvent(id: string, data: Partial<{ endTime: Date | null; duration: number }>): Promise<IrrigationEvent> {
	return prisma.irrigationEvent.update({ where: { id }, data })
}

export async function deleteIrrigationEvent(id: string): Promise<IrrigationEvent> {
	return prisma.irrigationEvent.delete({ where: { id } })
}

/** Returns the latest open (no endTime) irrigation event, optionally scoped to a zone. */
export async function getLatestOpenIrrigationEvent(zoneId?: string): Promise<IrrigationEvent | null> {
	return prisma.irrigationEvent.findFirst({
		where: { endTime: null, ...(zoneId ? { zoneId } : {}) },
		orderBy: { startTime: 'desc' },
	})
}

