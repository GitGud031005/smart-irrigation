// GET /api/users/me — returns current user info from JWT session
// PATCH /api/users/me — update Adafruit IO credentials for the current user
import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { getUserById, updateAdafruitConfig } from '@/services/auth-service'

export async function GET(request: NextRequest) {
	const token = request.cookies.get(COOKIE_NAME)?.value
	if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	const payload = await verifyToken(token)
	if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
	const user = await getUserById(payload.userId)
	if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
	return NextResponse.json({
		userId: user.id,
		email: user.email,
		adafruitUsername: user.adafruitUsername,
		adafruitKey: user.adafruitKey,
	})
}

export async function PATCH(request: NextRequest) {
	const token = request.cookies.get(COOKIE_NAME)?.value
	if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	const payload = await verifyToken(token)
	if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

	let body: { adafruitUsername?: string; adafruitKey?: string }
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
	}

	const { adafruitUsername, adafruitKey } = body
	if (typeof adafruitUsername !== 'string' || typeof adafruitKey !== 'string') {
		return NextResponse.json({ error: 'adafruitUsername and adafruitKey are required strings' }, { status: 400 })
	}

	const updated = await updateAdafruitConfig(payload.userId, { adafruitUsername, adafruitKey })
	return NextResponse.json({
		userId: updated.id,
		email: updated.email,
		adafruitUsername: updated.adafruitUsername,
		adafruitKey: updated.adafruitKey,
	})
}
