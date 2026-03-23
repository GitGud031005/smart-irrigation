/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../lib/prisma'
import type { Alert } from '../lib/generated/prisma/client'
import type { AlertSeverity, AlertType, AlertActor } from '../models/alert'

export async function createAlert(data: {
	zoneId?: string
	message: string
	severity?: AlertSeverity
	type: AlertType
	actor: AlertActor
}): Promise<Alert> {
	return prisma.alert.create({
		data: {
			zoneId: data.zoneId,
			message: data.message,
			severity: data.severity ?? 'INFO',
			type: data.type,
			actor: data.actor,
		},
	})
}

export async function getAlert(id: string): Promise<Alert | null> {
	return prisma.alert.findUnique({ where: { id } })
}

export async function listAlerts(opts?: {
	zoneId?: string
	severity?: AlertSeverity
	type?: AlertType
	actor?: AlertActor
	take?: number
}): Promise<Alert[]> {
	const where: any = {}
	if (opts?.zoneId) where.zoneId = opts.zoneId
	if (opts?.severity) where.severity = opts.severity
	if (opts?.type) where.type = opts.type
	if (opts?.actor) where.actor = opts.actor
	return prisma.alert.findMany({ where, orderBy: { createdAt: 'desc' }, take: opts?.take })
}

export async function deleteAlert(id: string): Promise<Alert> {
	return prisma.alert.delete({ where: { id } })
}


