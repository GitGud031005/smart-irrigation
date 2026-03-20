import { NextRequest, NextResponse } from 'next/server'
import { getAlert, deleteAlert } from '@/services/alert-service'
import { toJsonSafe } from '@/lib/utils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ alertId: string }> }) {
	const { alertId } = await params
	try {
		const alert = await getAlert(alertId)
		if (!alert) return NextResponse.json({ error: 'Not found' }, { status: 404 })
		return new NextResponse(JSON.stringify(toJsonSafe(alert)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ alertId: string }> }) {
	const { alertId } = await params
	try {
		const alert = await deleteAlert(alertId)
		return new NextResponse(JSON.stringify(toJsonSafe(alert)), { headers: { 'Content-Type': 'application/json' } })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 400 })
	}
}
