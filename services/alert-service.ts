/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../lib/prisma'
import type { Alert } from '../lib/generated/prisma/client'

export async function createAlert(data: { zoneId?: string; message: string }): Promise<Alert> {
	return prisma.alert.create({ data: { zoneId: data.zoneId, message: data.message } })
}

export async function getAlert(id: string): Promise<Alert | null> {
	return prisma.alert.findUnique({ where: { id } })
}

export async function listAlerts(opts?: { zoneId?: string; take?: number }): Promise<Alert[]> {
	const where: any = {}
	if (opts?.zoneId) where.zoneId = opts.zoneId
	return prisma.alert.findMany({ where, orderBy: { createdAt: 'desc' }, take: opts?.take })
}

export async function deleteAlert(id: string): Promise<Alert> {
	return prisma.alert.delete({ where: { id } })
}

