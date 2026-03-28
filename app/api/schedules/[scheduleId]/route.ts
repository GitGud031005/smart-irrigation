/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getSchedule, updateSchedule, deleteSchedule } from '@/services/schedule-service'
import { toJsonSafe } from '@/lib/utils'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { validate, updateScheduleSchema } from '@/lib/validators'

async function authorizeSchedule(request: NextRequest, scheduleId: string) {
	const token = request.cookies.get(COOKIE_NAME)?.value
	const payload = token ? await verifyToken(token) : null
	if (!payload) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
	const schedule = await getSchedule(scheduleId)
	if (!schedule) return { error: NextResponse.json({ error: 'Not found' }, { status: 404 }) }
	if (schedule.userId && schedule.userId !== payload.userId)
		return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
	return { payload, schedule }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ scheduleId: string }> }) {
	const { scheduleId } = await params
	const auth = await authorizeSchedule(request, scheduleId)
	if ('error' in auth) return auth.error
	try {
		return new NextResponse(JSON.stringify(toJsonSafe(auth.schedule)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ scheduleId: string }> }) {
	const { scheduleId } = await params
	const auth = await authorizeSchedule(request, scheduleId)
	if ('error' in auth) return auth.error
	let body: any
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
	try {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { userId: _ignored, ...rest } = body
		const v = validate(updateScheduleSchema, rest)
		if (!v.success) return NextResponse.json({ error: v.error }, { status: 400 })
		const s = await updateSchedule(scheduleId, v.data)
		return new NextResponse(JSON.stringify(toJsonSafe(s)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ scheduleId: string }> }) {
	const { scheduleId } = await params
	const auth = await authorizeSchedule(request, scheduleId)
	if ('error' in auth) return auth.error
	try {
		const s = await deleteSchedule(scheduleId)
		return new NextResponse(JSON.stringify(toJsonSafe(s)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}
