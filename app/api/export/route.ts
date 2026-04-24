// GET /api/export - Export historical data as CSV or JSON (FR9, UC-09)
// Query params: format (csv|json), startDate, endDate, zoneId
import { NextRequest, NextResponse } from 'next/server'
import { exportData } from '@/services/export-service'
import { verifyToken, COOKIE_NAME } from '@/lib/auth'

const SUPPORTED_FORMATS = ['csv', 'json']

export async function GET(request: NextRequest) {
	const token = request.cookies.get(COOKIE_NAME)?.value
	if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	const payload = await verifyToken(token)
	if (!payload) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

	const { searchParams } = request.nextUrl
	const format = (searchParams.get('format') ?? 'json').toLowerCase()

	if (!SUPPORTED_FORMATS.includes(format)) {
		return NextResponse.json(
			{ error: `Unsupported format "${format}". Supported: ${SUPPORTED_FORMATS.join(', ')}` },
			{ status: 400 },
		)
	}

	const startDate = searchParams.get('startDate') ?? undefined
	const endDate   = searchParams.get('endDate')   ?? undefined

	if (startDate && isNaN(Date.parse(startDate))) {
		return NextResponse.json({ error: 'Invalid startDate — must be ISO 8601' }, { status: 400 })
	}
	if (endDate && isNaN(Date.parse(endDate))) {
		return NextResponse.json({ error: 'Invalid endDate — must be ISO 8601' }, { status: 400 })
	}

	const opts = {
		startDate,
		endDate,
		zoneId: searchParams.get('zoneId') ?? undefined,
	}

	try {
		const { content, contentType } = await exportData(format, opts)
		const filename = `irrigation-export-${new Date().toISOString().slice(0, 10)}.${format}`
		return new NextResponse(content, {
			headers: {
				'Content-Type': contentType,
				'Content-Disposition': `attachment; filename="${filename}"`,
			},
		})
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}
