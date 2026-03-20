/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../lib/prisma'
import type { Device, DeviceStatus } from '../lib/generated/prisma/client'

export async function createDevice(data: { deviceType?: string; zoneId?: string; status?: DeviceStatus }): Promise<Device> {
	const payload: any = {}
	if (data.deviceType) payload.deviceType = data.deviceType
	if (data.zoneId) payload.zoneId = data.zoneId
	if (data.status) payload.status = data.status
	return prisma.device.create({ data: payload })
}

export async function getDevice(id: string): Promise<Device | null> {
	return prisma.device.findUnique({ where: { id } })
}

export async function listDevices(): Promise<Device[]> {
	return prisma.device.findMany()
}

export async function updateDevice(id: string, data: Partial<{ deviceType: string; zoneId: string | null; status: DeviceStatus; lastActiveAt: Date | null }>): Promise<Device> {
	const payload: any = {}
	if (data.deviceType !== undefined) payload.deviceType = data.deviceType
	if (data.zoneId !== undefined) payload.zoneId = data.zoneId
	if (data.status !== undefined) payload.status = data.status
	if (data.lastActiveAt !== undefined) payload.lastActiveAt = data.lastActiveAt
	return prisma.device.update({ where: { id }, data: payload })
}

export async function deleteDevice(id: string): Promise<Device> {
	return prisma.device.delete({ where: { id } })
}

