/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { listSchedules, createSchedule } from '@/services/schedule-service'
import { toJsonSafe } from '@/lib/utils'

export async function GET() {
	try {
		const schedules = await listSchedules()
		return new NextResponse(JSON.stringify(toJsonSafe(schedules)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	let body: any
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
	try {
		const s = await createSchedule(body)
		return new NextResponse(JSON.stringify(toJsonSafe(s)), { headers: { 'Content-Type': 'application/json' }, status: 201 })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}
