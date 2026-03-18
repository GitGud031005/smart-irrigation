/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../lib/prisma'
import type { Device } from '../lib/generated/prisma/client'

export async function createDevice(data: { deviceType?: string; zoneId?: string }): Promise<Device> {
	const payload: any = {}
	if (data.deviceType) payload.deviceType = data.deviceType
	if (data.zoneId) payload.zoneId = data.zoneId
	return prisma.device.create({ data: payload })
}

export async function getDevice(id: string): Promise<Device | null> {
	return prisma.device.findUnique({ where: { id } })
}

export async function listDevices(): Promise<Device[]> {
	return prisma.device.findMany()
}

export async function updateDevice(id: string, data: Partial<{ deviceType: string; zoneId: string | null }>): Promise<Device> {
	const payload: any = {}
	if (data.deviceType !== undefined) payload.deviceType = data.deviceType
	if (data.zoneId !== undefined) payload.zoneId = data.zoneId
	return prisma.device.update({ where: { id }, data: payload })
}

export async function deleteDevice(id: string): Promise<Device> {
	return prisma.device.delete({ where: { id } })
}

