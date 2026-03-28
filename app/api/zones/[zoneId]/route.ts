/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getZone, updateZone, deleteZone } from '@/services/zone-service'
import { toJsonSafe } from '@/lib/utils'
import { validate, updateZoneSchema } from '@/lib/validators'

export async function GET(request: NextRequest, { params }: { params: Promise<{ zoneId: string }> }) {
	const { zoneId } = await params
	try {
		const zone = await getZone(zoneId)
		if (!zone) return NextResponse.json({ error: 'Not found' }, { status: 404 })
		return new NextResponse(JSON.stringify(toJsonSafe(zone)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ zoneId: string }> }) {
	const { zoneId } = await params
	let body: any
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
	try {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { userId: _ignored, ...rest } = body
		const v = validate(updateZoneSchema, rest)
		if (!v.success) return NextResponse.json({ error: v.error }, { status: 400 })
		const zone = await updateZone(zoneId, v.data)
		return new NextResponse(JSON.stringify(toJsonSafe(zone)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ zoneId: string }> }) {
	const { zoneId } = await params
	try {
		const zone = await deleteZone(zoneId)
		return new NextResponse(JSON.stringify(toJsonSafe(zone)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}
