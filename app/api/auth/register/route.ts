/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { createUser, getUserByEmail } from '@/services/auth-service'
import { toJsonSafe } from '@/lib/utils'

export async function POST(request: NextRequest) {
	let body: any
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
	const { email, password } = body
	if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 })
	try {
		const existing = await getUserByEmail(email)
		if (existing) return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
		const u = await createUser({ email, password })
		// hide passwordHash
		const safe = toJsonSafe(u) as any
		delete safe.passwordHash
		return new NextResponse(JSON.stringify(safe), { headers: { 'Content-Type': 'application/json' }, status: 201 })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}
