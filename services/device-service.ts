/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from '../lib/prisma'
import type { Device } from '../lib/generated/prisma/client'

export async function createDevice(data: { deviceType?: string; zoneId?: bigint | number }): Promise<Device> {
	const payload: any = {}
	if (data.deviceType) payload.deviceType = data.deviceType
	if (data.zoneId) payload.zoneId = BigInt(data.zoneId)
	return prisma.device.create({ data: payload })
}

export async function getDevice(id: bigint | number): Promise<Device | null> {
	return prisma.device.findUnique({ where: { id: BigInt(id) } })
}

export async function listDevices(): Promise<Device[]> {
	return prisma.device.findMany()
}

export async function updateDevice(id: bigint | number, data: Partial<{ deviceType: string; zoneId: bigint | number | null }>): Promise<Device> {
	const payload: any = {}
	if (data.deviceType !== undefined) payload.deviceType = data.deviceType
	if (data.zoneId !== undefined) payload.zoneId = data.zoneId === null ? null : BigInt(data.zoneId)
	return prisma.device.update({ where: { id: BigInt(id) }, data: payload })
}

export async function deleteDevice(id: bigint | number): Promise<Device> {
	return prisma.device.delete({ where: { id: BigInt(id) } })
}

