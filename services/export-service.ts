// Export service (FR9, UC-05)
import prisma from '../lib/prisma'
import { toJsonSafe } from '../lib/utils'

interface ExportOptions {
	startDate?: string
	endDate?: string
	zoneId?: string
}

async function fetchData(opts: ExportOptions) {
	const where: Record<string, unknown> = {}
	if (opts.zoneId) where.zoneId = opts.zoneId
	if (opts.startDate || opts.endDate) {
		const range: Record<string, Date> = {}
		if (opts.startDate) range.gte = new Date(opts.startDate)
		if (opts.endDate) range.lte = new Date(opts.endDate)
		where.recordedAt = range
	}
	const [readings, events] = await Promise.all([
		prisma.sensorReading.findMany({ where, orderBy: { recordedAt: 'asc' } }),
		prisma.irrigationEvent.findMany({
			where: opts.zoneId ? { zoneId: opts.zoneId } : {},
			orderBy: { startTime: 'asc' },
		}),
	])
	return { readings, events }
}

export async function exportDataJSON(opts: ExportOptions): Promise<string> {
	const data = await fetchData(opts)
	return JSON.stringify(toJsonSafe(data), null, 2)
}

export async function exportDataCSV(opts: ExportOptions): Promise<string> {
	const { readings, events } = await fetchData(opts)
	const lines: string[] = []

	lines.push('=== Sensor Readings ===')
	lines.push('id,zoneId,soilMoisture,temperature,humidity,recordedAt')
	for (const r of readings) {
		lines.push([
			r.id,
			r.zoneId ?? '',
			r.soilMoisture ?? '',
			r.temperature ?? '',
			r.humidity ?? '',
			r.recordedAt.toISOString(),
		].join(','))
	}

	lines.push('')
	lines.push('=== Irrigation Events ===')
	lines.push('id,zoneId,startTime,endTime,duration')
	for (const e of events) {
		lines.push([
			e.id,
			e.zoneId ?? '',
			e.startTime.toISOString(),
			e.endTime ? e.endTime.toISOString() : '',
			e.duration ?? '',
		].join(','))
	}

	return lines.join('\n')
}
