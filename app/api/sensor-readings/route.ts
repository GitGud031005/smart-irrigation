// GET /api/sensor-readings — List all sensor readings (with filtering)
// POST /api/sensor-readings — Create a new sensor reading

import { NextRequest, NextResponse } from 'next/server'
import { querySensorReadings, createSensorReading } from '@/services/sensor-service'
import { toJsonSafe } from '@/lib/utils'

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl
	const zoneId = searchParams.get('zoneId') ?? undefined
	const since = searchParams.get('since') ? new Date(searchParams.get('since')!) : undefined
	const until = searchParams.get('until') ? new Date(searchParams.get('until')!) : undefined
	const take = searchParams.get('take') ? parseInt(searchParams.get('take')!, 10) : undefined

	try {
		const readings = await querySensorReadings({ zoneId, since, until, take })
		return new NextResponse(JSON.stringify(toJsonSafe(readings)), {
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	let body: { zoneId?: string; soilMoisture?: number; temperature?: number; humidity?: number; recordedAt?: string }
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
	try {
		const reading = await createSensorReading({
			zoneId: body.zoneId,
			soilMoisture: body.soilMoisture,
			temperature: body.temperature,
			humidity: body.humidity,
			recordedAt: body.recordedAt ? new Date(body.recordedAt) : undefined,
		})
		return new NextResponse(JSON.stringify(toJsonSafe(reading)), {
			headers: { 'Content-Type': 'application/json' },
			status: 201,
		})
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

