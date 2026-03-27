/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { listProfiles, createProfile } from '@/services/profile-service'
import { toJsonSafe } from '@/lib/utils'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

export async function GET(request: NextRequest) {
	const token = request.cookies.get(COOKIE_NAME)?.value
	const payload = token ? await verifyToken(token) : null
	if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	try {
		const profiles = await listProfiles(payload.userId)
		return new NextResponse(JSON.stringify(toJsonSafe(profiles)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	const token = request.cookies.get(COOKIE_NAME)?.value
	const payload = token ? await verifyToken(token) : null
	if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	let body: any
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
	try {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { userId: _ignored, ...rest } = body
		const profile = await createProfile({ ...rest, userId: payload.userId })
		return new NextResponse(JSON.stringify(toJsonSafe(profile)), { headers: { 'Content-Type': 'application/json' }, status: 201 })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}
