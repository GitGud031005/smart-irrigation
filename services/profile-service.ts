import prisma from '../lib/prisma'
import type { IrrigationProfile, IrrigationMode } from '../lib/generated/prisma/client'

export async function createProfile(data: { name?: string; minMoisture: number; maxMoisture: number; mode?: IrrigationMode; userId: string }): Promise<IrrigationProfile> {
	return prisma.irrigationProfile.create({ data })
}

export async function getProfile(id: string): Promise<IrrigationProfile | null> {
	return prisma.irrigationProfile.findUnique({ where: { id } })
}

export async function listProfiles(userId: string): Promise<IrrigationProfile[]> {
	return prisma.irrigationProfile.findMany({ where: { userId } })
}

export async function updateProfile(id: string, data: Partial<{ name: string; minMoisture: number; maxMoisture: number; mode: IrrigationMode }>): Promise<IrrigationProfile> {
	return prisma.irrigationProfile.update({ where: { id }, data })
}

export async function deleteProfile(id: string): Promise<IrrigationProfile> {
	const count = await prisma.zone.count({ where: { profileId: id } })
	if (count > 0) throw new Error('Profile is assigned to one or more zones')
	return prisma.irrigationProfile.delete({ where: { id } })
}

