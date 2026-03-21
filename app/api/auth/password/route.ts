// PUT /api/auth/password — Change user password

import { NextRequest, NextResponse } from 'next/server'
import { updateUserPassword } from '@/services/auth-service'
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
		// TODO: Fetch user and compare currentPassword with stored passwordHash
		// For now, just verify token is valid and call the service

		const user = await updateUserPassword(userId, newPassword)
		return NextResponse.json({ success: true, user: { id: user.id, email: user.email } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}
