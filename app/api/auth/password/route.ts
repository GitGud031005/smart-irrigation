// PUT /api/auth/password — Change user password

import { NextRequest, NextResponse } from 'next/server'
import { updateUserPassword, getUserById } from '@/services/auth-service'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import bcrypt from 'bcrypt'

export async function PUT(request: NextRequest) {
	let body: { currentPassword?: string; newPassword?: string }
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
	}

	const { currentPassword, newPassword } = body
	if (!currentPassword || !newPassword) {
		return NextResponse.json({ error: 'currentPassword and newPassword required' }, { status: 400 })
	}

	try {
		// Verify token from cookie
		const token = request.cookies.get(COOKIE_NAME)?.value
		if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

		const payload = await verifyToken(token)
		if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
		const userId = payload.userId as string

		// Verify current password matches
		const user = await getUserById(userId)
		if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
		const passwordMatch = await bcrypt.compare(currentPassword, user.passwordHash)
		if (!passwordMatch) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 })

		const updated = await updateUserPassword(userId, newPassword)
		return NextResponse.json({ success: true, user: { id: updated.id, email: updated.email } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}
