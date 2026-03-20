# Smart Irrigation API Documentation

Complete API reference for the Smart Irrigation System with comprehensive examples for testing in Postman.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Zones](#zones)
3. [Sensors](#sensors)
4. [Sensor Readings](#sensor-readings)
5. [Devices](#devices)
6. [Profiles](#profiles)
7. [Schedules](#schedules)
8. [Alerts](#alerts)
9. [Irrigation Events](#irrigation-events)
10. [Data Export](#data-export)
11. [Ordered Test Flow (Empty Database)](#ordered-test-flow-empty-database)

---

## Authentication

All authenticated routes read a `session` cookie set automatically on login/register. No `Authorization` header is needed.

### 1. Register User

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}
```

**Notes:**
- Session cookie is set automatically on successful registration
- Password must be at least 8 characters

---

### 2. Login User

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com"
}
```

**Session Cookie Set:**
```
Set-Cookie: session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800
```

**Error Response (401):**
```json
{
  "error": "Invalid email or password"
}
```

---

### 3. Logout User

**Request:**
```http
POST /api/auth/logout
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

**Session Cookie Cleared:**
```
Set-Cookie: session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0
```

---

### 4. Change Password

**Request:**
```http
PUT /api/auth/password
Content-Type: application/json

{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com"
  }
}
```

**Error Response (401):**
```json
{
  "error": "Unauthorized"
}
```

**Notes:**
- Requires valid session cookie
- Both `currentPassword` and `newPassword` are required

---

## Zones

Zone fields: `id`, `name`, `userId`, `profileId`, `scheduleId`, `currentMoisture`, `currentHumidity`, `currentTemperature`

### 1. Create Zone

**Request:**
```http
POST /api/zones
Content-Type: application/json

{
  "name": "Front Garden"
}
```

**Response (201):**
```json
{
  "id": "zone-001-uuid",
  "name": "Front Garden",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "profileId": null,
  "scheduleId": null,
  "currentMoisture": 0,
  "currentHumidity": 0,
  "currentTemperature": 0
}
```

**Notes:**
- `userId` is automatically set from the authenticated user (JWT token), not from request body
- Only `name` is required in the request

---

### 2. List All Zones

**Request:**
```http
GET /api/zones
```

**Response (200):**
```json
[
  {
    "id": "zone-001-uuid",
    "name": "Front Garden",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "profileId": null,
    "scheduleId": null,
    "currentMoisture": 45.2,
    "currentHumidity": 65.0,
    "currentTemperature": 22.5
  },
  {
    "id": "zone-002-uuid",
    "name": "Back Patio",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "profileId": null,
    "scheduleId": null,
    "currentMoisture": 38.0,
    "currentHumidity": 60.0,
    "currentTemperature": 23.1
  }
]
```

---

### 3. Get Zone Details

**Request:**
```http
GET /api/zones/zone-001-uuid
```

**Response (200):**
```json
{
  "id": "zone-001-uuid",
  "name": "Front Garden",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "profileId": "profile-001-uuid",
  "scheduleId": null,
  "currentMoisture": 45.2,
  "currentHumidity": 65.0,
  "currentTemperature": 22.5
}
```

---

### 4. Update Zone

**Request:**
```http
PUT /api/zones/zone-001-uuid
Content-Type: application/json

{
  "name": "Front Garden (Updated)",
  "profileId": "profile-001-uuid"
}
```

**Notes:**
- `userId` cannot be changed via API — zone ownership is immutable

**Response (200):**
```json
{
  "id": "zone-001-uuid",
  "name": "Front Garden (Updated)",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "profileId": "profile-001-uuid",
  "scheduleId": null,
  "currentMoisture": 45.2,
  "currentHumidity": 65.0,
  "currentTemperature": 22.5
}
```

---

### 5. Delete Zone

**Request:**
```http
DELETE /api/zones/zone-001-uuid
```

**Response (200):**
```json
{
  "id": "zone-001-uuid",
  "name": "Front Garden (Updated)",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "profileId": "profile-001-uuid",
  "scheduleId": null,
  "currentMoisture": 45.2,
  "currentHumidity": 65.0,
  "currentTemperature": 22.5
}
```

---

## Sensors

Sensor fields: `id`, `sensorType`, `modelName`, `zoneId`

### 1. Create Sensor

**Request:**
```http
POST /api/sensors
Content-Type: application/json

{
  "sensorType": "SOIL_MOISTURE",
  "modelName": "DS18B20",
  "zoneId": "zone-001-uuid"
}
```

**Response (201):**
```json
{
  "id": "sensor-001-uuid",
  "sensorType": "SOIL_MOISTURE",
  "modelName": "DS18B20",
  "zoneId": "zone-001-uuid"
}
```

---

### 2. List All Sensors

**Request:**
```http
GET /api/sensors
```

**Response (200):**
```json
[
  {
    "id": "sensor-001-uuid",
    "sensorType": "SOIL_MOISTURE",
    "modelName": "DS18B20",
    "zoneId": "zone-001-uuid"
  },
  {
    "id": "sensor-002-uuid",
    "sensorType": "TEMPERATURE",
    "modelName": "DHT22",
    "zoneId": "zone-001-uuid"
  }
]
```

---

### 3. Get Sensor Details

**Request:**
```http
GET /api/sensors/sensor-001-uuid
```

**Response (200):**
```json
{
  "id": "sensor-001-uuid",
  "sensorType": "SOIL_MOISTURE",
  "modelName": "DS18B20",
  "zoneId": "zone-001-uuid"
}
```

---

### 4. Update Sensor

**Request:**
```http
PUT /api/sensors/sensor-001-uuid
Content-Type: application/json

{
  "modelName": "DS18B20-Pro"
}
```

**Response (200):**
```json
{
  "id": "sensor-001-uuid",
  "sensorType": "SOIL_MOISTURE",
  "modelName": "DS18B20-Pro",
  "zoneId": "zone-001-uuid"
}
```

---

### 5. Delete Sensor

**Request:**
```http
DELETE /api/sensors/sensor-001-uuid
```

**Response (200):**
```json
{
  "id": "sensor-001-uuid",
  "sensorType": "SOIL_MOISTURE",
  "modelName": "DS18B20-Pro",
  "zoneId": "zone-001-uuid"
}
```

---

### 6. Get Latest Sensor Data (Adafruit to DB)

Fetches the current readings from all Adafruit IO feeds and persists them to the database.

**Request:**
```http
GET /api/sensors/latest
```

**Response (200):**
```json
{
  "soilMoisture": {
    "value": 45.2,
    "created_at": "2026-03-20T10:30:00Z"
  },
  "temperature": {
    "value": 22.5,
    "created_at": "2026-03-20T10:30:00Z"
  },
  "humidity": {
    "value": 65.0,
    "created_at": "2026-03-20T10:30:00Z"
  },
  "savedReadingId": "reading-001-uuid",
  "savedAt": "2026-03-20T10:30:05Z"
}
```

**Error Response (502):**
```json
{
  "error": "Failed to fetch from Adafruit IO"
}
```

---

### 7. Sync Sensor Data from Adafruit

Batch-imports all new readings from all three Adafruit feeds since the last stored timestamp. Deduplicates by timestamp.

**Request:**
```http
POST /api/sensors/sync
```

**Response (200):**
```json
{
  "inserted": 12
}
```

**Notes:**
- `inserted` is the number of new readings written to the database
- Already-stored readings are skipped (deduplication by `recordedAt` timestamp)
- Reads from three feeds: soil-moisture, temperature, humidity

---

### 8. Get Sensor Readings (per sensor)

**Request:**
```http
GET /api/sensors/sensor-001-uuid/readings?since=2026-03-01T00:00:00Z&until=2026-03-20T00:00:00Z&take=100
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `since` | ISO date | Filter readings after this timestamp |
| `until` | ISO date | Filter readings before this timestamp |
| `take` | integer | Max number of results to return |

**Response (200):**
```json
[
  {
    "id": "reading-001-uuid",
    "sensorId": "sensor-001-uuid",
    "soilMoisture": 45.2,
    "temperature": 22.5,
    "humidity": 65.0,
    "recordedAt": "2026-03-20T10:30:00Z"
  },
  {
    "id": "reading-002-uuid",
    "sensorId": "sensor-001-uuid",
    "soilMoisture": 43.8,
    "temperature": 22.1,
    "humidity": 64.5,
    "recordedAt": "2026-03-20T10:00:00Z"
  }
]
```

**Error Response (404):**
```json
{
  "error": "Sensor not found"
}
```

---

### 9. Create Sensor Reading (per sensor)

**Request:**
```http
POST /api/sensors/sensor-001-uuid/readings
Content-Type: application/json

{
  "soilMoisture": 45.2,
  "temperature": 22.5,
  "humidity": 65.0,
  "recordedAt": "2026-03-20T10:30:00Z"
}
```

**Response (201):**
```json
{
  "id": "reading-001-uuid",
  "sensorId": "sensor-001-uuid",
  "soilMoisture": 45.2,
  "temperature": 22.5,
  "humidity": 65.0,
  "recordedAt": "2026-03-20T10:30:00Z"
}
```

**Notes:**
- `recordedAt` is optional — defaults to current time
- All measurement fields (`soilMoisture`, `temperature`, `humidity`) are individually optional

---

## Sensor Readings

Cross-sensor reading management via `/api/sensor-readings`.

SensorReading fields: `id`, `sensorId`, `soilMoisture`, `temperature`, `humidity`, `recordedAt`

### 1. List Sensor Readings (with filters)

**Request:**
```http
GET /api/sensor-readings?sensorId=sensor-001-uuid&zoneId=zone-001-uuid&since=2026-03-01T00:00:00Z&until=2026-03-20T00:00:00Z&take=50
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sensorId` | UUID | Filter by specific sensor |
| `zoneId` | UUID | Filter by zone (all sensors in that zone) |
| `since` | ISO date | Filter readings after this timestamp |
| `until` | ISO date | Filter readings before this timestamp |
| `take` | integer | Max number of results to return |

**Response (200):**
```json
[
  {
    "id": "reading-001-uuid",
    "sensorId": "sensor-001-uuid",
    "soilMoisture": 45.2,
    "temperature": 22.5,
    "humidity": 65.0,
    "recordedAt": "2026-03-20T10:30:00Z"
  },
  {
    "id": "reading-002-uuid",
    "sensorId": "sensor-002-uuid",
    "soilMoisture": null,
    "temperature": 21.8,
    "humidity": 63.2,
    "recordedAt": "2026-03-20T10:25:00Z"
  }
]
```

---

### 2. Get Sensor Reading

**Request:**
```http
GET /api/sensor-readings/reading-001-uuid
```

**Response (200):**
```json
{
  "id": "reading-001-uuid",
  "sensorId": "sensor-001-uuid",
  "soilMoisture": 45.2,
  "temperature": 22.5,
  "humidity": 65.0,
  "recordedAt": "2026-03-20T10:30:00Z"
}
```

**Error Response (404):**
```json
{
  "error": "Not found"
}
```

---

### 3. Update Sensor Reading

**Request:**
```http
PUT /api/sensor-readings/reading-001-uuid
Content-Type: application/json

{
  "soilMoisture": 46.0,
  "temperature": 22.8
}
```

**Response (200):**
```json
{
  "id": "reading-001-uuid",
  "sensorId": "sensor-001-uuid",
  "soilMoisture": 46.0,
  "temperature": 22.8,
  "humidity": 65.0,
  "recordedAt": "2026-03-20T10:30:00Z"
}
```

---

### 4. Delete Sensor Reading

**Request:**
```http
DELETE /api/sensor-readings/reading-001-uuid
```

**Response (200):**
```json
{
  "id": "reading-001-uuid",
  "sensorId": "sensor-001-uuid",
  "soilMoisture": 45.2,
  "temperature": 22.5,
  "humidity": 65.0,
  "recordedAt": "2026-03-20T10:30:00Z"
}
```

---

## Devices

Device fields: `id`, `deviceType`, `zoneId`, `status` (`ACTIVE` | `OFFLINE` | `ERROR`), `lastActiveAt`

### 1. Create Device

**Request:**
```http
POST /api/devices
Content-Type: application/json

{
  "deviceType": "PUMP",
  "zoneId": "zone-001-uuid"
}
```

**Response (201):**
```json
{
  "id": "device-001-uuid",
  "deviceType": "PUMP",
  "zoneId": "zone-001-uuid",
  "status": "ACTIVE",
  "lastActiveAt": null
}
```

---

### 2. List All Devices

**Request:**
```http
GET /api/devices
```

**Response (200):**
```json
[
  {
    "id": "device-001-uuid",
    "deviceType": "PUMP",
    "zoneId": "zone-001-uuid",
    "status": "ACTIVE",
    "lastActiveAt": null
  },
  {
    "id": "device-002-uuid",
    "deviceType": "SPRINKLER",
    "zoneId": "zone-002-uuid",
    "status": "OFFLINE",
    "lastActiveAt": "2026-03-20T09:00:00Z"
  }
]
```

---

### 3. Get Device Details

**Request:**
```http
GET /api/devices/device-001-uuid
```

**Response (200):**
```json
{
  "id": "device-001-uuid",
  "deviceType": "PUMP",
  "zoneId": "zone-001-uuid",
  "status": "ACTIVE",
  "lastActiveAt": null
}
```

---

### 4. Update Device

**Request:**
```http
PUT /api/devices/device-001-uuid
Content-Type: application/json

{
  "deviceType": "PUMP",
  "status": "OFFLINE"
}
```

**Response (200):**
```json
{
  "id": "device-001-uuid",
  "deviceType": "PUMP",
  "zoneId": "zone-001-uuid",
  "status": "OFFLINE",
  "lastActiveAt": null
}
```

---

### 5. Delete Device

**Request:**
```http
DELETE /api/devices/device-001-uuid
```

**Response (200):**
```json
{
  "id": "device-001-uuid",
  "deviceType": "PUMP",
  "zoneId": "zone-001-uuid",
  "status": "OFFLINE",
  "lastActiveAt": "2026-03-20T10:00:00Z"
}
```

---

### 6. Control Device (Pump)

Controls a pump device: sends a command to Adafruit IO, updates the device status in the database, and opens or closes an irrigation event automatically.

**Request:**
```http
POST /api/devices/device-001-uuid/control
Content-Type: application/json

{
  "action": "1"
}
```

**Body:**

| Field | Value | Description |
|-------|-------|-------------|
| `action` | `"1"` | Turn pump **ON** — sets `status: ACTIVE`, opens new IrrigationEvent |
| `action` | `"0"` | Turn pump **OFF** — sets `status: OFFLINE`, closes the latest open IrrigationEvent |

**Response (200) — Turn ON:**
```json
{
  "success": true,
  "pump": "1",
  "device": {
    "id": "device-001-uuid",
    "deviceType": "PUMP",
    "zoneId": "zone-001-uuid",
    "status": "ACTIVE",
    "lastActiveAt": "2026-03-20T10:30:00Z"
  },
  "event": {
    "id": "event-001-uuid",
    "zoneId": "zone-001-uuid",
    "startTime": "2026-03-20T10:30:00Z",
    "endTime": null,
    "duration": null
  },
  "adafruitResponse": {
    "id": "456791",
    "value": "1",
    "created_at": "2026-03-20T10:30:00Z"
  }
}
```

**Response (200) — Turn OFF:**
```json
{
  "success": true,
  "pump": "0",
  "device": {
    "id": "device-001-uuid",
    "deviceType": "PUMP",
    "zoneId": "zone-001-uuid",
    "status": "OFFLINE",
    "lastActiveAt": "2026-03-20T10:45:00Z"
  },
  "event": {
    "id": "event-001-uuid",
    "zoneId": "zone-001-uuid",
    "startTime": "2026-03-20T10:30:00Z",
    "endTime": "2026-03-20T10:45:00Z",
    "duration": 900
  },
  "adafruitResponse": {
    "id": "456792",
    "value": "0",
    "created_at": "2026-03-20T10:45:00Z"
  }
}
```

**Error Response (404):**
```json
{
  "error": "Device not found"
}
```

**Error Response (400):**
```json
{
  "error": "action must be '1' (on) or '0' (off)"
}
```

**Error Response (502):**
```json
{
  "error": "Failed to reach Adafruit IO"
}
```

**Notes:**
- `duration` is calculated in **seconds** when the event is closed
- If no open irrigation event exists when turning OFF, `event` will be `null`

---

## Profiles

IrrigationProfile fields: `id`, `name`, `minMoisture`, `maxMoisture`, `wateringDuration`, `mode` (`AUTO` | `MANUAL` | `AI`)

### 1. Create Profile

**Request:**
```http
POST /api/profiles
Content-Type: application/json

{
  "name": "Summer Garden",
  "minMoisture": 30,
  "maxMoisture": 70,
  "wateringDuration": 1800
}
```

**Response (201):**
```json
{
  "id": "profile-001-uuid",
  "name": "Summer Garden",
  "minMoisture": 30,
  "maxMoisture": 70,
  "wateringDuration": 1800,
  "mode": "AUTO"
}
```

---

### 2. List All Profiles

**Request:**
```http
GET /api/profiles
```

**Response (200):**
```json
[
  {
    "id": "profile-001-uuid",
    "name": "Summer Garden",
    "minMoisture": 30,
    "maxMoisture": 70,
    "wateringDuration": 1800,
    "mode": "AUTO"
  }
]
```

---

### 3. Get Profile Details

**Request:**
```http
GET /api/profiles/profile-001-uuid
```

**Response (200):**
```json
{
  "id": "profile-001-uuid",
  "name": "Summer Garden",
  "minMoisture": 30,
  "maxMoisture": 70,
  "wateringDuration": 1800,
  "mode": "AUTO"
}
```

---

### 4. Update Profile

**Request:**
```http
PUT /api/profiles/profile-001-uuid
Content-Type: application/json

{
  "minMoisture": 35,
  "maxMoisture": 75
}
```

**Response (200):**
```json
{
  "id": "profile-001-uuid",
  "name": "Summer Garden",
  "minMoisture": 35,
  "maxMoisture": 75,
  "wateringDuration": 1800,
  "mode": "AUTO"
}
```

---

### 5. Delete Profile

**Request:**
```http
DELETE /api/profiles/profile-001-uuid
```

**Response (200):**
```json
{
  "id": "profile-001-uuid",
  "name": "Summer Garden",
  "minMoisture": 35,
  "maxMoisture": 75,
  "wateringDuration": 1800,
  "mode": "AUTO"
}
```

**Error Response (400):**
```json
{
  "error": "Profile is assigned to one or more zones"
}
```

---

## Schedules

Schedule fields: `id`, `cronExpression`, `isActive`

### 1. Create Schedule

**Request:**
```http
POST /api/schedules
Content-Type: application/json

{
  "cronExpression": "0 6 * * 1-5",
  "isActive": true
}
```

**Response (201):**
```json
{
  "id": "schedule-001-uuid",
  "cronExpression": "0 6 * * 1-5",
  "isActive": true
}
```

**Notes:**
- `cronExpression` uses standard cron syntax (minute hour day month weekday)
- Example: `"0 6 * * 1-5"` = every weekday at 06:00

---

### 2. List All Schedules

**Request:**
```http
GET /api/schedules
```

**Response (200):**
```json
[
  {
    "id": "schedule-001-uuid",
    "cronExpression": "0 6 * * 1-5",
    "isActive": true
  },
  {
    "id": "schedule-002-uuid",
    "cronExpression": "0 18 * * 6,0",
    "isActive": true
  }
]
```

---

### 3. Get Schedule Details

**Request:**
```http
GET /api/schedules/schedule-001-uuid
```

**Response (200):**
```json
{
  "id": "schedule-001-uuid",
  "cronExpression": "0 6 * * 1-5",
  "isActive": true
}
```

---

### 4. Update Schedule

**Request:**
```http
PUT /api/schedules/schedule-001-uuid
Content-Type: application/json

{
  "cronExpression": "30 5 * * 1-5",
  "isActive": false
}
```

**Response (200):**
```json
{
  "id": "schedule-001-uuid",
  "cronExpression": "30 5 * * 1-5",
  "isActive": false
}
```

---

### 5. Delete Schedule

**Request:**
```http
DELETE /api/schedules/schedule-001-uuid
```

**Response (200):**
```json
{
  "id": "schedule-001-uuid",
  "cronExpression": "30 5 * * 1-5",
  "isActive": false
}
```

**Error Response (400):**
```json
{
  "error": "Schedule is assigned to a zone"
}
```

---

## Alerts

Alert fields: `id`, `zoneId`, `message`, `createdAt`

### 1. Create Alert

**Request:**
```http
POST /api/alerts
Content-Type: application/json

{
  "message": "Soil moisture critically low",
  "zoneId": "zone-001-uuid"
}
```

**Response (201):**
```json
{
  "id": "alert-001-uuid",
  "zoneId": "zone-001-uuid",
  "message": "Soil moisture critically low",
  "createdAt": "2026-03-20T11:25:00Z"
}
```

---

### 2. List All Alerts

**Request:**
```http
GET /api/alerts
```

**Response (200):**
```json
[
  {
    "id": "alert-001-uuid",
    "zoneId": "zone-001-uuid",
    "message": "Soil moisture critically low",
    "createdAt": "2026-03-20T11:25:00Z"
  }
]
```

---

### 3. List Alerts with Filter

**Request:**
```http
GET /api/alerts?zoneId=zone-001-uuid&take=10
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `zoneId` | UUID | Filter by zone |
| `take` | integer | Max results to return |

**Response (200):**
```json
[
  {
    "id": "alert-001-uuid",
    "zoneId": "zone-001-uuid",
    "message": "Soil moisture critically low",
    "createdAt": "2026-03-20T11:25:00Z"
  }
]
```

---

### 4. Get Alert Details

**Request:**
```http
GET /api/alerts/alert-001-uuid
```

**Response (200):**
```json
{
  "id": "alert-001-uuid",
  "zoneId": "zone-001-uuid",
  "message": "Soil moisture critically low",
  "createdAt": "2026-03-20T11:25:00Z"
}
```

---

### 5. Delete Alert

**Request:**
```http
DELETE /api/alerts/alert-001-uuid
```

**Response (200):**
```json
{
  "id": "alert-001-uuid",
  "zoneId": "zone-001-uuid",
  "message": "Soil moisture critically low",
  "createdAt": "2026-03-20T11:25:00Z"
}
```

---

## Irrigation Events

IrrigationEvent fields: `id`, `zoneId`, `startTime`, `endTime`, `duration`

Events are automatically created/closed by `POST /api/devices/[deviceId]/control`. These endpoints allow manual management.

### 1. Create Irrigation Event

**Request:**
```http
POST /api/irrigation-events
Content-Type: application/json

{
  "zoneId": "zone-001-uuid",
  "startTime": "2026-03-20T06:00:00Z"
}
```

**Response (201):**
```json
{
  "id": "event-001-uuid",
  "zoneId": "zone-001-uuid",
  "startTime": "2026-03-20T06:00:00Z",
  "endTime": null,
  "duration": null
}
```

---

### 2. List Irrigation Events

**Request:**
```http
GET /api/irrigation-events?zoneId=zone-001-uuid&since=2026-03-01T00:00:00Z&until=2026-03-31T00:00:00Z&take=20
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `zoneId` | UUID | Filter by zone |
| `since` | ISO date | Filter events starting after this time |
| `until` | ISO date | Filter events starting before this time |
| `take` | integer | Max results (ordered by `startTime` desc) |

**Response (200):**
```json
[
  {
    "id": "event-001-uuid",
    "zoneId": "zone-001-uuid",
    "startTime": "2026-03-20T06:00:00Z",
    "endTime": "2026-03-20T06:30:00Z",
    "duration": 1800
  },
  {
    "id": "event-002-uuid",
    "zoneId": "zone-001-uuid",
    "startTime": "2026-03-19T06:00:00Z",
    "endTime": "2026-03-19T06:25:00Z",
    "duration": 1500
  }
]
```

---

### 3. Get Irrigation Event Details

**Request:**
```http
GET /api/irrigation-events/event-001-uuid
```

**Response (200):**
```json
{
  "id": "event-001-uuid",
  "zoneId": "zone-001-uuid",
  "startTime": "2026-03-20T06:00:00Z",
  "endTime": "2026-03-20T06:30:00Z",
  "duration": 1800
}
```

---

### 4. Update Irrigation Event

**Request:**
```http
PUT /api/irrigation-events/event-001-uuid
Content-Type: application/json

{
  "endTime": "2026-03-20T06:35:00Z",
  "duration": 2100
}
```

**Response (200):**
```json
{
  "id": "event-001-uuid",
  "zoneId": "zone-001-uuid",
  "startTime": "2026-03-20T06:00:00Z",
  "endTime": "2026-03-20T06:35:00Z",
  "duration": 2100
}
```

---

### 5. Delete Irrigation Event

**Request:**
```http
DELETE /api/irrigation-events/event-001-uuid
```

**Response (200):**
```json
{
  "id": "event-001-uuid",
  "zoneId": "zone-001-uuid",
  "startTime": "2026-03-20T06:00:00Z",
  "endTime": "2026-03-20T06:35:00Z",
  "duration": 2100
}
```

---

## Data Export

### 1. Export as JSON

**Request:**
```http
GET /api/export?format=json&startDate=2026-03-01&endDate=2026-03-31&zoneId=zone-001-uuid
```

**Response (200):**
```json
{
  "sensorReadings": [
    {
      "id": "reading-001-uuid",
      "sensorId": "sensor-001-uuid",
      "soilMoisture": 45.2,
      "temperature": 22.5,
      "humidity": 65.0,
      "recordedAt": "2026-03-20T10:30:00Z"
    }
  ],
  "irrigationEvents": [
    {
      "id": "event-001-uuid",
      "zoneId": "zone-001-uuid",
      "startTime": "2026-03-20T06:00:00Z",
      "endTime": "2026-03-20T06:30:00Z",
      "duration": 1800
    }
  ]
}
```

**Response Headers:**
```
Content-Type: application/json
Content-Disposition: attachment; filename="export-2026-03-20.json"
```

---

### 2. Export as CSV

**Request:**
```http
GET /api/export?format=csv&startDate=2026-03-01&endDate=2026-03-31
```

**Response (200):**
```csv
SENSOR READINGS
id,sensorId,soilMoisture,temperature,humidity,recordedAt
reading-001-uuid,sensor-001-uuid,45.2,22.5,65.0,2026-03-20T10:30:00Z

IRRIGATION EVENTS
id,zoneId,startTime,endTime,duration
event-001-uuid,zone-001-uuid,2026-03-20T06:00:00Z,2026-03-20T06:30:00Z,1800
```

**Response Headers:**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="export-2026-03-20.csv"
```

---

### 3. Export with Zone Filter

**Request:**
```http
GET /api/export?format=json&zoneId=zone-001-uuid
```

**Response (200):**
```json
{
  "sensorReadings": [...],
  "irrigationEvents": [...]
}
```

---

## Ordered Test Flow (Empty Database)

Step-by-step guide to test all API endpoints starting from an empty database. Save all resource IDs as variables as you go.

### Step 1: Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
```

**Save:** `USER_ID` from response `id`

---

### Step 2: Login User

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "TestPassword123!"
}
```

**Note:** Session cookie auto-set. All subsequent requests use it automatically.

---

### Step 3: Create Zone 1

```http
POST /api/zones
Content-Type: application/json

{
  "name": "Front Garden",
  "userId": "{USER_ID}"
}
```

**Save:** `ZONE_1_ID`

---

### Step 4: Create Zone 2

```http
POST /api/zones
Content-Type: application/json

{
  "name": "Back Patio",
  "userId": "{USER_ID}"
}
```

**Save:** `ZONE_2_ID`

---

### Step 5: List All Zones

```http
GET /api/zones
```

**Expected:** 2 zones returned

---

### Step 6: Create Sensor 1 (Soil Moisture)

```http
POST /api/sensors
Content-Type: application/json

{
  "sensorType": "SOIL_MOISTURE",
  "modelName": "DS18B20",
  "zoneId": "{ZONE_1_ID}"
}
```

**Save:** `SENSOR_1_ID`

---

### Step 7: Create Sensor 2 (Temperature)

```http
POST /api/sensors
Content-Type: application/json

{
  "sensorType": "TEMPERATURE",
  "modelName": "DHT22",
  "zoneId": "{ZONE_1_ID}"
}
```

**Save:** `SENSOR_2_ID`

---

### Step 8: Create Device 1 (Pump)

```http
POST /api/devices
Content-Type: application/json

{
  "deviceType": "PUMP",
  "zoneId": "{ZONE_1_ID}"
}
```

**Save:** `DEVICE_1_ID`

---

### Step 9: List All Devices

```http
GET /api/devices
```

**Expected:** 1 device with `status: "ACTIVE"` and `lastActiveAt: null`

---

### Step 10: Get Latest Sensor Data from Adafruit

```http
GET /api/sensors/latest
```

**Expected:** soilMoisture, temperature, humidity from Adafruit IO + new DB reading persisted.

**Save:** `READING_ID` from response `savedReadingId`

---

### Step 11: Sync Historical Data from Adafruit

```http
POST /api/sensors/sync
```

**Expected:** `{ "inserted": N }` — readings bulk-imported since last stored timestamp.

---

### Step 12: List Sensor Readings (per sensor)

```http
GET /api/sensors/{SENSOR_1_ID}/readings?take=10
```

**Expected:** Up to 10 readings for Sensor 1

---

### Step 13: Create Manual Sensor Reading

```http
POST /api/sensors/{SENSOR_1_ID}/readings
Content-Type: application/json

{
  "soilMoisture": 45.2,
  "temperature": 22.5,
  "humidity": 65.0
}
```

**Save:** `READING_1_ID`

---

### Step 14: List All Sensor Readings (cross-sensor)

```http
GET /api/sensor-readings?zoneId={ZONE_1_ID}&take=20
```

**Expected:** Readings from all sensors in Zone 1

---

### Step 15: Get Single Sensor Reading

```http
GET /api/sensor-readings/{READING_1_ID}
```

**Expected:** The reading created in Step 13

---

### Step 16: Update Sensor Reading

```http
PUT /api/sensor-readings/{READING_1_ID}
Content-Type: application/json

{
  "soilMoisture": 46.0
}
```

**Expected:** Updated reading with `soilMoisture: 46.0`

---

### Step 17: Create Profile 1

```http
POST /api/profiles
Content-Type: application/json

{
  "name": "Summer Garden",
  "minMoisture": 30,
  "maxMoisture": 70,
  "wateringDuration": 1800
}
```

**Save:** `PROFILE_1_ID`

---

### Step 18: Create Schedule 1

```http
POST /api/schedules
Content-Type: application/json

{
  "cronExpression": "0 6 * * 1-5",
  "isActive": true
}
```

**Save:** `SCHEDULE_1_ID`

---

### Step 19: Assign Profile and Schedule to Zone

```http
PUT /api/zones/{ZONE_1_ID}
Content-Type: application/json

{
  "profileId": "{PROFILE_1_ID}",
  "scheduleId": "{SCHEDULE_1_ID}"
}
```

**Expected:** Zone 1 updated with profile and schedule linked

---

### Step 20: Turn Pump ON (Device Control)

```http
POST /api/devices/{DEVICE_1_ID}/control
Content-Type: application/json

{
  "action": "1"
}
```

**Expected:**
- `pump: "1"`
- `device.status: "ACTIVE"`, `device.lastActiveAt` set to now
- New IrrigationEvent opened (`endTime: null`)

**Save:** `EVENT_1_ID` from response `event.id`

---

### Step 21: List Irrigation Events

```http
GET /api/irrigation-events?zoneId={ZONE_1_ID}
```

**Expected:** 1 open event with `endTime: null`

---

### Step 22: Turn Pump OFF (Device Control)

```http
POST /api/devices/{DEVICE_1_ID}/control
Content-Type: application/json

{
  "action": "0"
}
```

**Expected:**
- `pump: "0"`
- `device.status: "OFFLINE"`, `device.lastActiveAt` updated
- IrrigationEvent closed with `endTime` and `duration` (in seconds) set

---

### Step 23: Verify Closed Irrigation Event

```http
GET /api/irrigation-events/{EVENT_1_ID}
```

**Expected:** Event with `endTime` and `duration` populated

---

### Step 24: Create Alert

```http
POST /api/alerts
Content-Type: application/json

{
  "message": "Soil moisture critically low in Front Garden",
  "zoneId": "{ZONE_1_ID}"
}
```

**Save:** `ALERT_1_ID`

---

### Step 25: List Alerts by Zone

```http
GET /api/alerts?zoneId={ZONE_1_ID}
```

**Expected:** 1 alert for Zone 1

---

### Step 26: Change Password

```http
PUT /api/auth/password
Content-Type: application/json

{
  "currentPassword": "TestPassword123!",
  "newPassword": "UpdatedPassword456!"
}
```

**Expected:** `{ "success": true, "user": { "id": "...", "email": "..." } }`

---

### Step 27: Export Data as JSON

```http
GET /api/export?format=json&zoneId={ZONE_1_ID}
```

**Expected:** JSON download with sensor readings and irrigation events for Zone 1

---

### Step 28: Export Data as CSV

```http
GET /api/export?format=csv
```

**Expected:** CSV file download with all data

---

### Step 29: Delete Sensor Reading

```http
DELETE /api/sensor-readings/{READING_1_ID}
```

**Expected:** Deleted reading returned

---

### Step 30: Delete Alert

```http
DELETE /api/alerts/{ALERT_1_ID}
```

**Expected:** Alert deleted

---

### Step 31: Delete Irrigation Event

```http
DELETE /api/irrigation-events/{EVENT_1_ID}
```

**Expected:** Event deleted

---

### Step 32: Logout User

```http
POST /api/auth/logout
```

**Expected:** Session cookie cleared, user logged out

---

## Summary

| Endpoint | Method(s) | Description |
|----------|-----------|-------------|
| `/api/auth/register` | POST | Register user |
| `/api/auth/login` | POST | Login |
| `/api/auth/logout` | POST | Logout |
| `/api/auth/password` | PUT | Change password |
| `/api/zones` | GET, POST | List / Create zones |
| `/api/zones/[id]` | GET, PUT, DELETE | Get / Update / Delete zone |
| `/api/sensors` | GET, POST | List / Create sensors |
| `/api/sensors/[id]` | GET, PUT, DELETE | Get / Update / Delete sensor |
| `/api/sensors/latest` | GET | Fetch latest from Adafruit IO + persist to DB |
| `/api/sensors/sync` | POST | Batch sync all feeds from Adafruit IO |
| `/api/sensors/[id]/readings` | GET, POST | Per-sensor reading list / create |
| `/api/sensor-readings` | GET | Cross-sensor readings with filters |
| `/api/sensor-readings/[id]` | GET, PUT, DELETE | Get / Update / Delete reading |
| `/api/devices` | GET, POST | List / Create devices |
| `/api/devices/[id]` | GET, PUT, DELETE | Get / Update / Delete device |
| `/api/devices/[id]/control` | POST | Pump control (Adafruit + DB + IrrigationEvent) |
| `/api/profiles` | GET, POST | List / Create profiles |
| `/api/profiles/[id]` | GET, PUT, DELETE | Get / Update / Delete profile |
| `/api/schedules` | GET, POST | List / Create schedules |
| `/api/schedules/[id]` | GET, PUT, DELETE | Get / Update / Delete schedule |
| `/api/alerts` | GET, POST | List / Create alerts |
| `/api/alerts/[id]` | GET, DELETE | Get / Delete alert |
| `/api/irrigation-events` | GET, POST | List / Create events |
| `/api/irrigation-events/[id]` | GET, PUT, DELETE | Get / Update / Delete event |
| `/api/export` | GET | Export JSON or CSV |

**Total Routes:** 35+ endpoints across 11 resource types

**Authentication:** JWT session cookie (set automatically on login/register). All endpoints require the session cookie except `/api/auth/register` and `/api/auth/login`.

**Adafruit IO:** Used internally by `GET /api/sensors/latest`, `POST /api/sensors/sync`, and `POST /api/devices/[id]/control`. Not directly exposed to clients.