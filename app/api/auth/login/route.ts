/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getUserByEmail } from '@/services/auth-service'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
	let body: any
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
	const { email, password } = body
	if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 })
	try {
		const user = await getUserByEmail(email)
		if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
		const ok = await bcrypt.compare(password, (user as any).passwordHash)
		if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
		// For now return basic user info; session/token management is handled elsewhere
		const safe: any = { id: String((user as any).id), email: user.email }
		return NextResponse.json({ success: true, user: safe })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}
