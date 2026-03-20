// GET /api/export - Export historical data as CSV or JSON (FR9, UC-05)
// Query params: format (csv|json), startDate, endDate, zoneId, sensorId
import { NextRequest, NextResponse } from 'next/server'
import { exportDataCSV, exportDataJSON } from '@/services/export-service'

export async function GET(request: NextRequest) {
	const { searchParams } = request.nextUrl
	const format = searchParams.get('format') ?? 'json'
	const opts = {
		startDate: searchParams.get('startDate') ?? undefined,
		endDate: searchParams.get('endDate') ?? undefined,
		zoneId: searchParams.get('zoneId') ?? undefined,
		sensorId: searchParams.get('sensorId') ?? undefined,
	}

	try {
		if (format === 'csv') {
			const csv = await exportDataCSV(opts)
			return new NextResponse(csv, {
				headers: {
					'Content-Type': 'text/csv',
					'Content-Disposition': 'attachment; filename="irrigation-data.csv"',
				},
			})
		}
		const json = await exportDataJSON(opts)
		return new NextResponse(json, {
			headers: {
				'Content-Type': 'application/json',
				'Content-Disposition': 'attachment; filename="irrigation-data.json"',
			},
		})
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}
