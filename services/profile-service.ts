import prisma from '../lib/prisma'
import type { IrrigationProfile } from '../lib/generated/prisma/client'

export async function createProfile(data: { name?: string; minMoisture: number; maxMoisture: number; wateringDuration: number }): Promise<IrrigationProfile> {
	return prisma.irrigationProfile.create({ data })
}

export async function getProfile(id: bigint | number): Promise<IrrigationProfile | null> {
	return prisma.irrigationProfile.findUnique({ where: { id: BigInt(id) } })
}

export async function listProfiles(): Promise<IrrigationProfile[]> {
	return prisma.irrigationProfile.findMany()
}

export async function updateProfile(id: bigint | number, data: Partial<{ name: string; minMoisture: number; maxMoisture: number; wateringDuration: number }>): Promise<IrrigationProfile> {
	return prisma.irrigationProfile.update({ where: { id: BigInt(id) }, data })
}

export async function deleteProfile(id: bigint | number): Promise<IrrigationProfile> {
	const count = await prisma.zone.count({ where: { profileId: BigInt(id) } })
	if (count > 0) throw new Error('Profile is assigned to one or more zones')
	return prisma.irrigationProfile.delete({ where: { id: BigInt(id) } })
}

