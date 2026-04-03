import { z } from 'zod'

// ── Enums ──────────────────────────────────────────────────────
const IrrigationMode = z.enum(['AUTO', 'MANUAL', 'AI'])
const DeviceType = z.enum(['SOIL_MOISTURE_SENSOR', 'DHT20_TEMPERATURE_SENSOR', 'DHT20_HUMIDITY_SENSOR', 'RELAY_MODULE', 'ESP32'])
const DeviceStatus = z.enum(['ACTIVE', 'OFFLINE', 'ERROR'])
const AlertSeverity = z.enum(['INFO', 'WARNING', 'CRITICAL'])
const AlertType = z.enum(['DEVICE_STATUS', 'PLANT_STATUS', 'IRRIGATION_EVENT'])
const AlertActor = z.enum(['USER', 'SYSTEM', 'AI'])

// ── Zone ───────────────────────────────────────────────────────
export const createZoneSchema = z.object({
	name: z.string().min(1, 'name is required').max(100),
	profileId: z.uuid().optional().nullable(),
	scheduleId: z.uuid().optional().nullable(),
}).strict()

export const updateZoneSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	profileId: z.uuid().optional().nullable(),
	scheduleId: z.uuid().optional().nullable(),
}).strict()

// ── Profile ────────────────────────────────────────────────────
export const createProfileSchema = z.object({
	name: z.string().max(100).optional().nullable(),
	minMoisture: z.number().min(0).max(100),
	maxMoisture: z.number().min(0).max(100),
	mode: IrrigationMode.optional(),
}).strict().refine(d => d.minMoisture <= d.maxMoisture, { message: 'minMoisture must be ≤ maxMoisture' })

export const updateProfileSchema = z.object({
	name: z.string().max(100).optional().nullable(),
	minMoisture: z.number().min(0).max(100).optional(),
	maxMoisture: z.number().min(0).max(100).optional(),
	mode: IrrigationMode.optional(),
}).strict()

// ── Schedule / TimeSlot ────────────────────────────────────────
const timeSlotSchema = z.object({
	startTime: z.string().regex(/^\d{2}:\d{2}$/, 'startTime must be HH:MM'),
	days: z.array(z.string().min(1)).min(1, 'days must have at least 1 entry'),
	duration: z.number().int().positive('duration must be a positive integer (seconds)'),
})

export const createScheduleSchema = z.object({
	name: z.string().min(1, 'name is required').max(100),
	timeSlots: z.array(timeSlotSchema).min(1, 'at least one time slot is required'),
}).strict()

export const updateScheduleSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	timeSlots: z.array(timeSlotSchema).min(1, 'at least one time slot is required').optional(),
}).strict()

// ── Device ─────────────────────────────────────────────────────
export const createDeviceSchema = z.object({
	deviceType: DeviceType,
	feedKey: z.string().max(200).optional().nullable(),
	zoneId: z.string().min(1, 'zoneId is required'),
	status: DeviceStatus.default('OFFLINE'),
}).strict()

export const updateDeviceSchema = z.object({
	deviceType: DeviceType.optional(),
	feedKey: z.string().max(200).optional().nullable(),
	zoneId: z.string().optional(),
	status: DeviceStatus.optional(),
}).strict()

// ── Sensor Reading ─────────────────────────────────────────────
export const createSensorReadingSchema = z.object({
	zoneId: z.string().min(1, 'zoneId is required'),
	soilMoisture: z.number().optional(),
	temperature: z.number().optional(),
	humidity: z.number().optional(),
	recordedAt: z.iso.datetime().optional(),
}).strict()

export const updateSensorReadingSchema = z.object({
	soilMoisture: z.number().optional(),
	temperature: z.number().optional(),
	humidity: z.number().optional(),
}).strict()

// ── Irrigation Event ───────────────────────────────────────────
export const createIrrigationEventSchema = z.object({
	zoneId: z.string().optional(),
	startTime: z.iso.datetime('startTime must be an ISO 8601 datetime'),
	endTime: z.iso.datetime().optional().nullable(),
	duration: z.number().int().min(0).optional().nullable(),
}).strict()

export const updateIrrigationEventSchema = z.object({
	endTime: z.iso.datetime().optional().nullable(),
	duration: z.number().int().min(0).optional().nullable(),
}).strict()

// ── Alert ──────────────────────────────────────────────────────
export const createAlertSchema = z.object({
	type: AlertType,
	actor: AlertActor,
	message: z.string().min(1, 'message is required').max(1000),
	zoneId: z.string().optional().nullable(),
	severity: AlertSeverity.optional(),
}).strict()

// ── Helper ─────────────────────────────────────────────────────
/** Parse body with a Zod schema and return a formatted 400 error response if invalid. */
export function validate<T>(schema: z.ZodType<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
	const result = schema.safeParse(data)
	if (result.success) return { success: true, data: result.data }
	const messages = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')
	return { success: false, error: messages }
}
