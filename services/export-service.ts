// Export service (FR9, UC-05) — Strategy Pattern
//
// Adding a new format:
//   1. Implement ExportStrategy with a `serialize(data)` method.
//   2. Register it in EXPORT_STRATEGIES below.
//   3. The route automatically supports the new `format` query param value.
//
import prisma from '../lib/prisma'
import { toJsonSafe } from '../lib/utils'
import type { SensorReading, IrrigationEvent } from '../lib/generated/prisma/client'

// ─── Shared data shape ────────────────────────────────────────────────────────

export interface ExportOptions {
	startDate?: string
	endDate?: string
	zoneId?: string
}

interface ExportData {
	readings: SensorReading[]
	events:   IrrigationEvent[]
}

// ─── Strategy interface ───────────────────────────────────────────────────────

interface ExportStrategy {
	readonly contentType: string
	serialize(data: ExportData): string
}

// ─── Concrete strategies ──────────────────────────────────────────────────────

class JsonExportStrategy implements ExportStrategy {
	readonly contentType = 'application/json'

	serialize(data: ExportData): string {
		return JSON.stringify(toJsonSafe(data), null, 2)
	}
}

class CsvExportStrategy implements ExportStrategy {
	readonly contentType = 'text/csv'

	serialize({ readings, events }: ExportData): string {
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
}

// ─── Strategy registry ────────────────────────────────────────────────────────

const EXPORT_STRATEGIES: Record<string, ExportStrategy> = {
	json: new JsonExportStrategy(),
	csv:  new CsvExportStrategy(),
}

// ─── Data fetcher (shared across all strategies) ──────────────────────────────

async function fetchData(opts: ExportOptions): Promise<ExportData> {
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
			where: {
				...(opts.zoneId ? { zoneId: opts.zoneId } : {}),
				...(opts.startDate || opts.endDate ? {
					startTime: {
						...(opts.startDate ? { gte: new Date(opts.startDate) } : {}),
						...(opts.endDate   ? { lte: new Date(opts.endDate)   } : {}),
					},
				} : {}),
			},
			orderBy: { startTime: 'asc' },
		}),
	])
	return { readings, events }
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Export data using the named format strategy.
 * Returns `{ content, contentType }` — the route decides HTTP headers.
 * Throws if the format is unsupported.
 */
export async function exportData(
	format: string,
	opts: ExportOptions,
): Promise<{ content: string; contentType: string }> {
	const strategy = EXPORT_STRATEGIES[format.toLowerCase()]
	if (!strategy) {
		throw new Error(`Unsupported export format: "${format}". Supported: ${Object.keys(EXPORT_STRATEGIES).join(', ')}`)
	}
	const data = await fetchData(opts)
	return { content: strategy.serialize(data), contentType: strategy.contentType }
}

// ─── Legacy shims (kept for backwards compatibility) ──────────────────────────

export async function exportDataJSON(opts: ExportOptions): Promise<string> {
	const { content } = await exportData('json', opts)
	return content
}

export async function exportDataCSV(opts: ExportOptions): Promise<string> {
	const { content } = await exportData('csv', opts)
	return content
}
