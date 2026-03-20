/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getIrrigationEvent, updateIrrigationEvent, deleteIrrigationEvent } from '@/services/irrigation-service'
import { toJsonSafe } from '@/lib/utils'

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
		const ev = await updateIrrigationEvent(eventId, body)
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
