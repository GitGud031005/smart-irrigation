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

export async function updateUserPassword(id: string, newPassword: string): Promise<User> {
	const hash = await bcrypt.hash(newPassword, 10)
	return prisma.user.update({ where: { id }, data: { passwordHash: hash } })
}
