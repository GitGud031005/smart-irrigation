import prisma from '../lib/prisma'
import bcrypt from 'bcrypt'
import type { User } from '../lib/generated/prisma/client'

export async function createUser(data: { email: string; password: string }): Promise<User> {
	const hash = await bcrypt.hash(data.password, 10)
	return prisma.user.create({ data: { email: data.email, passwordHash: hash } })
}

export async function getUserByEmail(email: string): Promise<User | null> {
	return prisma.user.findUnique({ where: { email } })
}

export async function getUserById(id: string): Promise<User | null> {
	return prisma.user.findUnique({ where: { id } })
}

export async function updateUserPassword(id: string, newPassword: string): Promise<User> {
	const hash = await bcrypt.hash(newPassword, 10)
	return prisma.user.update({ where: { id }, data: { passwordHash: hash } })
}

export async function updateAdafruitConfig(id: string, data: { adafruitUsername: string; adafruitKey: string }): Promise<User> {
	return prisma.user.update({ where: { id }, data })
}
