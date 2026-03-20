/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getSchedule, updateSchedule, deleteSchedule } from '@/services/schedule-service'
import { toJsonSafe } from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ scheduleId: string }> }) {
	const { scheduleId } = await params
	try {
		const s = await getSchedule(scheduleId)
		if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })
		return new NextResponse(JSON.stringify(toJsonSafe(s)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ scheduleId: string }> }) {
	const { scheduleId } = await params
	let body: any
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
	try {
		const s = await updateSchedule(scheduleId, body)
		return new NextResponse(JSON.stringify(toJsonSafe(s)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ scheduleId: string }> }) {
	const { scheduleId } = await params
	try {
		const s = await deleteSchedule(scheduleId)
		return new NextResponse(JSON.stringify(toJsonSafe(s)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}
