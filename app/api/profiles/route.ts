/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { listProfiles, createProfile } from '@/services/profile-service'
import { toJsonSafe } from '@/lib/utils'

export async function GET() {
	try {
		const profiles = await listProfiles()
		return new NextResponse(JSON.stringify(toJsonSafe(profiles)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	let body: any
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
	try {
		const profile = await createProfile(body)
		return new NextResponse(JSON.stringify(toJsonSafe(profile)), { headers: { 'Content-Type': 'application/json' }, status: 201 })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}
