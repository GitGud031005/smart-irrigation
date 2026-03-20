/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getDevice, updateDevice, deleteDevice } from '@/services/device-service'
import { toJsonSafe } from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ deviceId: string }> }) {
	const { deviceId } = await params
	try {
		const d = await getDevice(deviceId)
		if (!d) return NextResponse.json({ error: 'Not found' }, { status: 404 })
		return new NextResponse(JSON.stringify(toJsonSafe(d)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ deviceId: string }> }) {
	const { deviceId } = await params
	let body: any
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
	try {
		const d = await updateDevice(deviceId, body)
		return new NextResponse(JSON.stringify(toJsonSafe(d)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ deviceId: string }> }) {
	const { deviceId } = await params
	try {
		const d = await deleteDevice(deviceId)
		return new NextResponse(JSON.stringify(toJsonSafe(d)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}
