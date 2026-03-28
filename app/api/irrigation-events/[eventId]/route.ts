/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getIrrigationEvent, updateIrrigationEvent, deleteIrrigationEvent } from '@/services/irrigation-service'
import { toJsonSafe } from '@/lib/utils'
import { validate, updateIrrigationEventSchema } from '@/lib/validators'

export async function GET(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
	const { eventId } = await params
	try {
		const ev = await getIrrigationEvent(eventId)
		if (!ev) return NextResponse.json({ error: 'Not found' }, { status: 404 })
		return new NextResponse(JSON.stringify(toJsonSafe(ev)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
	const { eventId } = await params
	let body: any
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
	try {
		const v = validate(updateIrrigationEventSchema, body)
		if (!v.success) return NextResponse.json({ error: v.error }, { status: 400 })
		const ev = await updateIrrigationEvent(eventId, {
			endTime: v.data.endTime ? new Date(v.data.endTime) : undefined,
			duration: v.data.duration ?? undefined,
		})
		return new NextResponse(JSON.stringify(toJsonSafe(ev)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ eventId: string }> }) {
	const { eventId } = await params
	try {
		const ev = await deleteIrrigationEvent(eventId)
		return new NextResponse(JSON.stringify(toJsonSafe(ev)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}
