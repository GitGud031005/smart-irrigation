/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { queryIrrigationEvents, createIrrigationEvent } from '@/services/irrigation-service'
import { toJsonSafe } from '@/lib/utils'
import { validate, createIrrigationEventSchema } from '@/lib/validators'

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl
	const zoneId = searchParams.get('zoneId') ?? undefined
	const since = searchParams.get('since') ? new Date(searchParams.get('since')!) : undefined
	const until = searchParams.get('until') ? new Date(searchParams.get('until')!) : undefined
	const take = searchParams.get('take') ? parseInt(searchParams.get('take')!, 10) : undefined
	try {
		const events = await queryIrrigationEvents({ zoneId, since, until, take })
		return new NextResponse(JSON.stringify(toJsonSafe(events)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	let body: any
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
	try {
		const v = validate(createIrrigationEventSchema, body)
		if (!v.success) return NextResponse.json({ error: v.error }, { status: 400 })
		const ev = await createIrrigationEvent({
			zoneId: v.data.zoneId,
			startTime: new Date(v.data.startTime),
			endTime: v.data.endTime ? new Date(v.data.endTime) : undefined,
			duration: v.data.duration ?? undefined,
		})
		return new NextResponse(JSON.stringify(toJsonSafe(ev)), { headers: { 'Content-Type': 'application/json' }, status: 201 })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}
