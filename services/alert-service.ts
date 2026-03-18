/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../lib/prisma'
import type { Alert } from '../lib/generated/prisma/client'

export async function createAlert(data: { zoneId?: bigint | number; message: string }): Promise<Alert> {
	return prisma.alert.create({ data: { zoneId: data.zoneId ? BigInt(data.zoneId) : undefined, message: data.message } })
}

export async function getAlert(id: bigint | number): Promise<Alert | null> {
	return prisma.alert.findUnique({ where: { id: BigInt(id) } })
}

export async function listAlerts(opts?: { zoneId?: bigint | number; take?: number }): Promise<Alert[]> {
	const where: any = {}
	if (opts?.zoneId) where.zoneId = BigInt(opts.zoneId)
	return prisma.alert.findMany({ where, orderBy: { createdAt: 'desc' }, take: opts?.take })
}

export async function deleteAlert(id: bigint | number): Promise<Alert> {
	return prisma.alert.delete({ where: { id: BigInt(id) } })
}

