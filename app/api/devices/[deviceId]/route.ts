import { NextRequest, NextResponse } from 'next/server'
import { getDevice, updateDevice, deleteDevice } from '@/services/device-service'
import { getZone } from '@/services/zone-service'
import { createIrrigationEvent, updateIrrigationEvent, getLatestOpenIrrigationEvent } from '@/services/irrigation-service'
import { createAlert } from '@/services/alert-service'
import { controlPump, sendData } from '@/lib/adafruit-io'
import { AuditPayloadFactory } from '@/lib/factories/audit-payload-factory'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'
import { getUserById } from '@/services/auth-service'
import { toJsonSafe } from '@/lib/utils'
import { validate, updateDeviceSchema } from '@/lib/validators'
import { verifyApiKey } from '@/lib/api-key'
import type { DeviceStatus } from '@/lib/generated/prisma/client'

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
	let body: Record<string, unknown>
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

	const device = await getDevice(deviceId)
	if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 })

	// Special case: relay device with status control
	if (body.status && device.deviceType === 'RELAY_MODULE' && (body.status === 'ACTIVE' || body.status === 'OFFLINE')) {
		// Map status to pump action: ACTIVE → "1", OFFLINE → "0"
		const action = body.status === 'ACTIVE' ? '1' : '0'

		// Auth
		const token = request.cookies.get(COOKIE_NAME)?.value
		if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		const payload = await verifyToken(token)
		if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
		const dbUser = await getUserById(payload.userId)
		if (!dbUser || !dbUser.adafruitUsername || !dbUser.adafruitKey) {
			return NextResponse.json({ error: 'Adafruit IO credentials not configured' }, { status: 422 })
		}
		const credentials = { username: dbUser.adafruitUsername, key: dbUser.adafruitKey }

		if (!device.feedKey) {
			return NextResponse.json({ error: 'Device has no feedKey configured' }, { status: 422 })
		}

		try {
			const adafruitResponse = await controlPump(action, credentials, device.feedKey)

			const now = new Date()
			const zoneId = device.zoneId ?? undefined
			const zone = zoneId ? await getZone(zoneId) : null
			const zoneName = zone?.name ?? undefined
			const auditFeedKey = process.env.ADAFRUIT_IO_FEED_ALERTS

			const updatedDevice = await updateDevice(deviceId, {
				status: body.status,
				lastActiveAt: now,
			})

			let event = null
			let alert = null

			if (action === '1') {
				// Pump ON — log device status change, open a new irrigation event
				const deviceStatusMessage = zoneName
					? `Pump in zone "${zoneName}" turned ON manually by user.`
					: `Pump turned ON manually by user.`
				const deviceStatusInput = { message: deviceStatusMessage, type: 'DEVICE_STATUS' as const, actor: 'USER' as const, severity: 'INFO' as const, zoneId }
				const deviceStatusAlert = await createAlert(deviceStatusInput)
				if (auditFeedKey) {
					const dsPayload = AuditPayloadFactory.fromAlert(deviceStatusInput, deviceStatusAlert.createdAt, deviceStatusAlert.id)
					await sendData(auditFeedKey, AuditPayloadFactory.serialize(dsPayload), credentials)
				}
				event = await createIrrigationEvent({ startTime: now, zoneId })
			} else {
				// Pump OFF — log device status change (always), close the open event if any
				const deviceStatusMessage = zoneName
					? `Pump in zone "${zoneName}" turned OFF manually by user.`
					: `Pump turned OFF manually by user.`
				const deviceStatusInput = { message: deviceStatusMessage, type: 'DEVICE_STATUS' as const, actor: 'USER' as const, severity: 'INFO' as const, zoneId }
				const deviceStatusAlert = await createAlert(deviceStatusInput)
				if (auditFeedKey) {
					const dsPayload = AuditPayloadFactory.fromAlert(deviceStatusInput, deviceStatusAlert.createdAt, deviceStatusAlert.id)
					await sendData(auditFeedKey, AuditPayloadFactory.serialize(dsPayload), credentials)
				}

				const open = await getLatestOpenIrrigationEvent(zoneId)
				if (open) {
					const duration = Math.round((now.getTime() - open.startTime.getTime()) / 1000)
					const mins = Math.floor(duration / 60)
					const secs = duration % 60
					const durationLabel = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
					const alertMessage = zoneName
						? `Manual irrigation in zone "${zoneName}" completed. Duration: ${durationLabel}.`
						: `Manual irrigation completed. Duration: ${durationLabel}.`
					event = await updateIrrigationEvent(open.id, { endTime: now, duration })
					const alertInput = { message: alertMessage, type: 'IRRIGATION_EVENT' as const, actor: 'USER' as const, severity: 'INFO' as const, zoneId }
					alert = await createAlert(alertInput)
					if (auditFeedKey) {
						const payload = AuditPayloadFactory.fromAlert(alertInput, alert.createdAt, alert.id)
						await sendData(auditFeedKey, AuditPayloadFactory.serialize(payload), credentials)
					}
				}
			}

			return NextResponse.json({
				success: true,
				pump: action,
				device: toJsonSafe(updatedDevice),
				event: toJsonSafe(event),
				alert: toJsonSafe(alert),
				adafruitResponse,
			})
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Unknown error'
			return NextResponse.json({ error: message }, { status: 502 })
		}
	}

	// Normal device update (no pump control)
	try {
		const v = validate(updateDeviceSchema, body)
		if (!v.success) return NextResponse.json({ error: v.error }, { status: 400 })
		const d = await updateDevice(deviceId, {
			deviceType: v.data.deviceType ?? undefined,
			feedKey: v.data.feedKey ?? undefined,
			zoneId: v.data.zoneId,
			status: v.data.status,
		})
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

// PATCH /api/devices/[deviceId]
// Gateway-only: update status and/or lastActiveAt without triggering pump control.
// Auth: X-API-Key header.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ deviceId: string }> }) {
	const auth = verifyApiKey(request)
	if (!auth.ok) return auth.error

	const { deviceId } = await params

	let body: { status?: DeviceStatus; lastActiveAt?: string }
	try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

	const { status, lastActiveAt } = body
	if (!status && !lastActiveAt) {
		return NextResponse.json({ error: 'Provide at least one of: status, lastActiveAt' }, { status: 400 })
	}

	const device = await getDevice(deviceId)
	if (!device) return NextResponse.json({ error: 'Device not found' }, { status: 404 })

	try {
		const updated = await updateDevice(deviceId, {
			...(status && { status }),
			...(lastActiveAt && { lastActiveAt: new Date(lastActiveAt) }),
		})
		return NextResponse.json(toJsonSafe(updated))
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}
