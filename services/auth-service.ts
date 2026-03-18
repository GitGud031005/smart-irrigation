import prisma from '../lib/prisma'
import bcrypt from 'bcrypt'
import type { User } from '../lib/generated/prisma/client'

export async function createUser(data: { email: string; password: string }): Promise<User> {
	const hash = await bcrypt.hash(data.password, 10)
	return prisma.user.create({ data: { email: data.email, passwordHash: hash } })
}

export async function getUserById(id: bigint | number): Promise<User | null> {
	return prisma.user.findUnique({ where: { id: BigInt(id) } })
}

export async function getUserByEmail(email: string): Promise<User | null> {
	return prisma.user.findUnique({ where: { email } })
}

export async function updateUserPassword(id: bigint | number, newPassword: string): Promise<User> {
	const hash = await bcrypt.hash(newPassword, 10)
	return prisma.user.update({ where: { id: BigInt(id) }, data: { passwordHash: hash } })
}

export async function deleteUser(id: bigint | number): Promise<User> {
	return prisma.user.delete({ where: { id: BigInt(id) } })
}

