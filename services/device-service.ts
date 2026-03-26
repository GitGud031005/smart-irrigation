/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../lib/prisma'
import type { Device, DeviceStatus, DeviceType } from '../lib/generated/prisma/client'

export async function createDevice(data: { deviceType?: DeviceType | null; feedKey?: string | null; zoneId?: string | null; status?: DeviceStatus }): Promise<Device> {
	const payload: any = {}
	if (data.deviceType) payload.deviceType = data.deviceType
	if (data.feedKey !== undefined) payload.feedKey = data.feedKey
	if (data.zoneId) payload.zoneId = data.zoneId
	if (data.status) payload.status = data.status
	return prisma.device.create({ data: payload })
}

export async function getDevice(id: string): Promise<Device | null> {
	return prisma.device.findUnique({ where: { id } })
}

export async function listDevices(filters?: { zoneId?: string; deviceType?: DeviceType; status?: DeviceStatus }): Promise<Device[]> {
	const where: any = {}
	if (filters?.zoneId) where.zoneId = filters.zoneId
	if (filters?.deviceType) where.deviceType = filters.deviceType
	if (filters?.status) where.status = filters.status
	return prisma.device.findMany({ where })
}

export async function updateDevice(id: string, data: Partial<{ deviceType: DeviceType | null; feedKey: string | null; zoneId: string | null; status: DeviceStatus; lastActiveAt: Date | null }>): Promise<Device> {
	const payload: any = {}
	if (data.deviceType !== undefined) payload.deviceType = data.deviceType
	if (data.feedKey !== undefined) payload.feedKey = data.feedKey
	if (data.zoneId !== undefined) payload.zoneId = data.zoneId
	if (data.status !== undefined) payload.status = data.status
	if (data.lastActiveAt !== undefined) payload.lastActiveAt = data.lastActiveAt
	return prisma.device.update({ where: { id }, data: payload })
}

export async function deleteDevice(id: string): Promise<Device> {
	return prisma.device.delete({ where: { id } })
}


/** Find a device of the given type within a specific zone. */
export async function getDeviceInZone(zoneId: string, deviceType: DeviceType): Promise<Device | null> {
	return prisma.device.findFirst({ where: { zoneId, deviceType } })
}

