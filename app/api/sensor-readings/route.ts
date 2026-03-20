// GET /api/sensor-readings — List all sensor readings (with filtering)

import { NextRequest, NextResponse } from 'next/server'
import { querySensorReadings } from '@/services/sensor-service'
import { toJsonSafe } from '@/lib/utils'

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl
	const sensorId = searchParams.get('sensorId') ?? undefined
	const zoneId = searchParams.get('zoneId') ?? undefined
	const since = searchParams.get('since') ? new Date(searchParams.get('since')!) : undefined
	const until = searchParams.get('until') ? new Date(searchParams.get('until')!) : undefined
	const take = searchParams.get('take') ? parseInt(searchParams.get('take')!, 10) : undefined

	try {
		const readings = await querySensorReadings({ sensorId, zoneId, since, until, take })
		return new NextResponse(JSON.stringify(toJsonSafe(readings)), {
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}
