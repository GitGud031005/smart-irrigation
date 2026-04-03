/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { listAlerts, createAlert } from '@/services/alert-service'
import { toJsonSafe } from '@/lib/utils'
import type { AlertSeverity, AlertType, AlertActor } from '@/models/alert'
import { validate, createAlertSchema } from '@/lib/validators'
import { verifyApiKey } from '@/lib/api-key'

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl
	const zoneId    = searchParams.get('zoneId')    ?? undefined
	const severity  = searchParams.get('severity')  as AlertSeverity | undefined
	const type      = searchParams.get('type')      as AlertType | undefined
	const actor     = searchParams.get('actor')     as AlertActor | undefined
	const take      = searchParams.get('take') ? parseInt(searchParams.get('take')!, 10) : undefined
	try {
		const alerts = await listAlerts({ zoneId, severity, type, actor, take })
		return new NextResponse(JSON.stringify(toJsonSafe(alerts)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	const auth = verifyApiKey(request)
	if (!auth.ok) return auth.error
	let body: any
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
	if (!body.type)  return NextResponse.json({ error: 'type is required' }, { status: 400 })
	if (!body.actor) return NextResponse.json({ error: 'actor is required' }, { status: 400 })
	if (!body.message) return NextResponse.json({ error: 'message is required' }, { status: 400 })
	const v = validate(createAlertSchema, body)
	if (!v.success) return NextResponse.json({ error: v.error }, { status: 400 })
	try {
		const a = await createAlert({ ...v.data, zoneId: v.data.zoneId ?? undefined })
		return new NextResponse(JSON.stringify(toJsonSafe(a)), { headers: { 'Content-Type': 'application/json' }, status: 201 })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

