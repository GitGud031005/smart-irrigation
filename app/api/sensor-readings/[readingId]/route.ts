// GET /api/sensor-readings/[readingId] — Get a specific sensor reading
// PUT /api/sensor-readings/[readingId] — Update sensor reading values
// DELETE /api/sensor-readings/[readingId] — Delete a sensor reading

/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { getSensorReading, updateSensorReading, deleteSensorReading } from '@/services/sensor-service'
import { toJsonSafe } from '@/lib/utils'
import { validate, updateSensorReadingSchema } from '@/lib/validators'

export async function GET(request: NextRequest, { params }: { params: Promise<{ readingId: string }> }) {
	const { readingId } = await params
	try {
		const reading = await getSensorReading(readingId)
		if (!reading) return NextResponse.json({ error: 'Not found' }, { status: 404 })
		return new NextResponse(JSON.stringify(toJsonSafe(reading)), {
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ readingId: string }> }) {
	const { readingId } = await params
	let body: any
	try {
		body = await request.json()
	} catch {
		return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
	}
	try {
		const v = validate(updateSensorReadingSchema, body)
		if (!v.success) return NextResponse.json({ error: v.error }, { status: 400 })
		const reading = await updateSensorReading(readingId, {
			soilMoisture: v.data.soilMoisture,
			temperature: v.data.temperature,
			humidity: v.data.humidity,
		})
		return new NextResponse(JSON.stringify(toJsonSafe(reading)), {
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ readingId: string }> }) {
	const { readingId } = await params
	try {
		const reading = await deleteSensorReading(readingId)
		return new NextResponse(JSON.stringify(toJsonSafe(reading)), {
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}
