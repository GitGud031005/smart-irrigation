/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { listDevices, createDevice } from '@/services/device-service'
import { toJsonSafe } from '@/lib/utils'

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl
	const zoneId = searchParams.get('zoneId') ?? undefined
	const deviceType = searchParams.get('deviceType') ?? undefined
	const status = searchParams.get('status') ?? undefined
	try {
		const devices = await listDevices({ zoneId, deviceType: deviceType as any, status: status as any })
		return new NextResponse(JSON.stringify(toJsonSafe(devices)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	let body: any
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
	try {
		const d = await createDevice(body)
		return new NextResponse(JSON.stringify(toJsonSafe(d)), { headers: { 'Content-Type': 'application/json' }, status: 201 })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}
