/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { listAlerts, createAlert } from '@/services/alert-service'
import { toJsonSafe } from '@/lib/utils'

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl
	const zoneId = searchParams.get('zoneId') ?? undefined
	const take = searchParams.get('take') ? parseInt(searchParams.get('take')!, 10) : undefined
	try {
		const alerts = await listAlerts({ zoneId, take })
		return new NextResponse(JSON.stringify(toJsonSafe(alerts)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	let body: any
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
	try {
		const a = await createAlert(body)
		return new NextResponse(JSON.stringify(toJsonSafe(a)), { headers: { 'Content-Type': 'application/json' }, status: 201 })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}
