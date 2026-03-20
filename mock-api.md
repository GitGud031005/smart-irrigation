# Smart Irrigation API Documentation

Complete API reference for the Smart Irrigation System with comprehensive examples for testing in Postman.

---

## Table of Contents

1. [Authentication](#authentication)
2. [Zones](#zones)
3. [Sensors](#sensors)
4. [Devices](#devices)
5. [Profiles](#profiles)
6. [Schedules](#schedules)
7. [Alerts](#alerts)
8. [Irrigation Events](#irrigation-events)
9. [Adafruit IO Integration](#adafruit-io-integration)
10. [Data Export](#data-export)
11. [Ordered Test Flow (Empty Database)](#ordered-test-flow-empty-database)

---

## Authentication

### 1. Register User

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe"
}
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2026-03-18T10:30:00Z"
}
```

**Notes:**
- User is automatically logged in after registration (Option A)
- Session cookie is set automatically
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
  "email": "user@example.com",
  "name": "John Doe"
}
```

**Session Cookie Set:**
```
Set-Cookie: session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800; Secure
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
Set-Cookie: session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Secure
```

---

## Zones

### 1. Create Zone

**Request:**
```http
POST /api/zones
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Front Garden",
  "description": "Front lawn area",
  "area": 50.5,
  "location": "North side of house"
}
```

**Response (201):**
```json
{
  "id": "zone-001-uuid",
  "name": "Front Garden",
  "description": "Front lawn area",
  "area": 50.5,
  "location": "North side of house",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T10:35:00Z",
  "updatedAt": "2026-03-18T10:35:00Z"
}
```

---

### 2. List All Zones

**Request:**
```http
GET /api/zones
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
[
  {
    "id": "zone-001-uuid",
    "name": "Front Garden",
    "description": "Front lawn area",
    "area": 50.5,
    "location": "North side of house",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-03-18T10:35:00Z",
    "updatedAt": "2026-03-18T10:35:00Z"
  },
  {
    "id": "zone-002-uuid",
    "name": "Back Patio",
    "description": "Patio plants",
    "area": 30.0,
    "location": "South side",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-03-18T10:36:00Z",
    "updatedAt": "2026-03-18T10:36:00Z"
  }
]
```

---

### 3. Get Zone Details

**Request:**
```http
GET /api/zones/zone-001-uuid
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "id": "zone-001-uuid",
  "name": "Front Garden",
  "description": "Front lawn area",
  "area": 50.5,
  "location": "North side of house",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T10:35:00Z",
  "updatedAt": "2026-03-18T10:35:00Z"
}
```

---

### 4. Update Zone

**Request:**
```http
PUT /api/zones/zone-001-uuid
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Front Garden (Updated)",
  "area": 55.5
}
```

**Response (200):**
```json
{
  "id": "zone-001-uuid",
  "name": "Front Garden (Updated)",
  "description": "Front lawn area",
  "area": 55.5,
  "location": "North side of house",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T10:35:00Z",
  "updatedAt": "2026-03-18T10:40:00Z"
}
```

---

### 5. Delete Zone

**Request:**
```http
DELETE /api/zones/zone-001-uuid
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "id": "zone-001-uuid",
  "name": "Front Garden (Updated)",
  "description": "Front lawn area",
  "area": 55.5,
  "location": "North side of house",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T10:35:00Z",
  "updatedAt": "2026-03-18T10:40:00Z"
}
```

---

## Sensors

### 1. Create Sensor

**Request:**
```http
POST /api/sensors
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Moisture Sensor 1",
  "type": "SOIL_MOISTURE",
  "zoneId": "zone-001-uuid",
  "location": "Near main sprinkler"
}
```

**Response (201):**
```json
{
  "id": "sensor-001-uuid",
  "name": "Moisture Sensor 1",
  "type": "SOIL_MOISTURE",
  "zoneId": "zone-001-uuid",
  "location": "Near main sprinkler",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T10:45:00Z",
  "updatedAt": "2026-03-18T10:45:00Z"
}
```

---

### 2. List All Sensors

**Request:**
```http
GET /api/sensors
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
[
  {
    "id": "sensor-001-uuid",
    "name": "Moisture Sensor 1",
    "type": "SOIL_MOISTURE",
    "zoneId": "zone-001-uuid",
    "location": "Near main sprinkler",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-03-18T10:45:00Z",
    "updatedAt": "2026-03-18T10:45:00Z"
  }
]
```

---

### 3. Get Sensor Details

**Request:**
```http
GET /api/sensors/sensor-001-uuid
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "id": "sensor-001-uuid",
  "name": "Moisture Sensor 1",
  "type": "SOIL_MOISTURE",
  "zoneId": "zone-001-uuid",
  "location": "Near main sprinkler",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T10:45:00Z",
  "updatedAt": "2026-03-18T10:45:00Z"
}
```

---

### 4. Update Sensor

**Request:**
```http
PUT /api/sensors/sensor-001-uuid
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Moisture Sensor 1 (Updated)",
  "location": "Garden center"
}
```

**Response (200):**
```json
{
  "id": "sensor-001-uuid",
  "name": "Moisture Sensor 1 (Updated)",
  "type": "SOIL_MOISTURE",
  "zoneId": "zone-001-uuid",
  "location": "Garden center",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T10:45:00Z",
  "updatedAt": "2026-03-18T10:50:00Z"
}
```

---

### 5. Delete Sensor

**Request:**
```http
DELETE /api/sensors/sensor-001-uuid
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "id": "sensor-001-uuid",
  "name": "Moisture Sensor 1 (Updated)",
  "type": "SOIL_MOISTURE",
  "zoneId": "zone-001-uuid",
  "location": "Garden center",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T10:45:00Z",
  "updatedAt": "2026-03-18T10:50:00Z"
}
```

---

## Devices

### 1. Create Device

**Request:**
```http
POST /api/devices
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Pump 1",
  "type": "PUMP",
  "zoneId": "zone-001-uuid"
}
```

**Response (201):**
```json
{
  "id": "device-001-uuid",
  "name": "Pump 1",
  "type": "PUMP",
  "zoneId": "zone-001-uuid",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T10:55:00Z",
  "updatedAt": "2026-03-18T10:55:00Z"
}
```

---

### 2. List All Devices

**Request:**
```http
GET /api/devices
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
[
  {
    "id": "device-001-uuid",
    "name": "Pump 1",
    "type": "PUMP",
    "zoneId": "zone-001-uuid",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-03-18T10:55:00Z",
    "updatedAt": "2026-03-18T10:55:00Z"
  }
]
```

---

### 3. Get Device Details

**Request:**
```http
GET /api/devices/device-001-uuid
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "id": "device-001-uuid",
  "name": "Pump 1",
  "type": "PUMP",
  "zoneId": "zone-001-uuid",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T10:55:00Z",
  "updatedAt": "2026-03-18T10:55:00Z"
}
```

---

### 4. Update Device

**Request:**
```http
PUT /api/devices/device-001-uuid
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Pump 1 (Main)"
}
```

**Response (200):**
```json
{
  "id": "device-001-uuid",
  "name": "Pump 1 (Main)",
  "type": "PUMP",
  "zoneId": "zone-001-uuid",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T10:55:00Z",
  "updatedAt": "2026-03-18T11:00:00Z"
}
```

---

### 5. Delete Device

**Request:**
```http
DELETE /api/devices/device-001-uuid
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "id": "device-001-uuid",
  "name": "Pump 1 (Main)",
  "type": "PUMP",
  "zoneId": "zone-001-uuid",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T10:55:00Z",
  "updatedAt": "2026-03-18T11:00:00Z"
}
```

---

## Profiles

### 1. Create Profile

**Request:**
```http
POST /api/profiles
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Summer Garden",
  "description": "Profile for summer watering",
  "minMoisture": 30,
  "maxMoisture": 70,
  "temperatureThreshold": 25
}
```

**Response (201):**
```json
{
  "id": "profile-001-uuid",
  "name": "Summer Garden",
  "description": "Profile for summer watering",
  "minMoisture": 30,
  "maxMoisture": 70,
  "temperatureThreshold": 25,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T11:05:00Z",
  "updatedAt": "2026-03-18T11:05:00Z"
}
```

---

### 2. List All Profiles

**Request:**
```http
GET /api/profiles
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
[
  {
    "id": "profile-001-uuid",
    "name": "Summer Garden",
    "description": "Profile for summer watering",
    "minMoisture": 30,
    "maxMoisture": 70,
    "temperatureThreshold": 25,
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-03-18T11:05:00Z",
    "updatedAt": "2026-03-18T11:05:00Z"
  }
]
```

---

### 3. Get Profile Details

**Request:**
```http
GET /api/profiles/profile-001-uuid
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "id": "profile-001-uuid",
  "name": "Summer Garden",
  "description": "Profile for summer watering",
  "minMoisture": 30,
  "maxMoisture": 70,
  "temperatureThreshold": 25,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T11:05:00Z",
  "updatedAt": "2026-03-18T11:05:00Z"
}
```

---

### 4. Update Profile

**Request:**
```http
PUT /api/profiles/profile-001-uuid
Content-Type: application/json
Authorization: Bearer <session-cookie>

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
  "description": "Profile for summer watering",
  "minMoisture": 35,
  "maxMoisture": 75,
  "temperatureThreshold": 25,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T11:05:00Z",
  "updatedAt": "2026-03-18T11:10:00Z"
}
```

---

### 5. Delete Profile

**Request:**
```http
DELETE /api/profiles/profile-001-uuid
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "id": "profile-001-uuid",
  "name": "Summer Garden",
  "description": "Profile for summer watering",
  "minMoisture": 35,
  "maxMoisture": 75,
  "temperatureThreshold": 25,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T11:05:00Z",
  "updatedAt": "2026-03-18T11:10:00Z"
}
```

---

## Schedules

### 1. Create Schedule

**Request:**
```http
POST /api/schedules
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Morning Watering",
  "description": "Daily morning irrigation",
  "zoneId": "zone-001-uuid",
  "profileId": "profile-001-uuid",
  "startTime": "06:00",
  "endTime": "08:00",
  "daysOfWeek": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
  "isActive": true
}
```

**Response (201):**
```json
{
  "id": "schedule-001-uuid",
  "name": "Morning Watering",
  "description": "Daily morning irrigation",
  "zoneId": "zone-001-uuid",
  "profileId": "profile-001-uuid",
  "startTime": "06:00",
  "endTime": "08:00",
  "daysOfWeek": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
  "isActive": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T11:15:00Z",
  "updatedAt": "2026-03-18T11:15:00Z"
}
```

---

### 2. List All Schedules

**Request:**
```http
GET /api/schedules
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
[
  {
    "id": "schedule-001-uuid",
    "name": "Morning Watering",
    "description": "Daily morning irrigation",
    "zoneId": "zone-001-uuid",
    "profileId": "profile-001-uuid",
    "startTime": "06:00",
    "endTime": "08:00",
    "daysOfWeek": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
    "isActive": true,
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-03-18T11:15:00Z",
    "updatedAt": "2026-03-18T11:15:00Z"
  }
]
```

---

### 3. Get Schedule Details

**Request:**
```http
GET /api/schedules/schedule-001-uuid
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "id": "schedule-001-uuid",
  "name": "Morning Watering",
  "description": "Daily morning irrigation",
  "zoneId": "zone-001-uuid",
  "profileId": "profile-001-uuid",
  "startTime": "06:00",
  "endTime": "08:00",
  "daysOfWeek": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
  "isActive": true,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T11:15:00Z",
  "updatedAt": "2026-03-18T11:15:00Z"
}
```

---

### 4. Update Schedule

**Request:**
```http
PUT /api/schedules/schedule-001-uuid
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "startTime": "05:30",
  "isActive": false
}
```

**Response (200):**
```json
{
  "id": "schedule-001-uuid",
  "name": "Morning Watering",
  "description": "Daily morning irrigation",
  "zoneId": "zone-001-uuid",
  "profileId": "profile-001-uuid",
  "startTime": "05:30",
  "endTime": "08:00",
  "daysOfWeek": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
  "isActive": false,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T11:15:00Z",
  "updatedAt": "2026-03-18T11:20:00Z"
}
```

---

### 5. Delete Schedule

**Request:**
```http
DELETE /api/schedules/schedule-001-uuid
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "id": "schedule-001-uuid",
  "name": "Morning Watering",
  "description": "Daily morning irrigation",
  "zoneId": "zone-001-uuid",
  "profileId": "profile-001-uuid",
  "startTime": "05:30",
  "endTime": "08:00",
  "daysOfWeek": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
  "isActive": false,
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T11:15:00Z",
  "updatedAt": "2026-03-18T11:20:00Z"
}
```

---

## Alerts

### 1. Create Alert

**Request:**
```http
POST /api/alerts
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "message": "Soil moisture critically low",
  "severity": "HIGH",
  "zoneId": "zone-001-uuid"
}
```

**Response (201):**
```json
{
  "id": "alert-001-uuid",
  "message": "Soil moisture critically low",
  "severity": "HIGH",
  "zoneId": "zone-001-uuid",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "isRead": false,
  "createdAt": "2026-03-18T11:25:00Z",
  "updatedAt": "2026-03-18T11:25:00Z"
}
```

---

### 2. List All Alerts

**Request:**
```http
GET /api/alerts
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
[
  {
    "id": "alert-001-uuid",
    "message": "Soil moisture critically low",
    "severity": "HIGH",
    "zoneId": "zone-001-uuid",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "isRead": false,
    "createdAt": "2026-03-18T11:25:00Z",
    "updatedAt": "2026-03-18T11:25:00Z"
  }
]
```

---

### 3. List Alerts with Filter

**Request:**
```http
GET /api/alerts?zoneId=zone-001-uuid&take=10
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
[
  {
    "id": "alert-001-uuid",
    "message": "Soil moisture critically low",
    "severity": "HIGH",
    "zoneId": "zone-001-uuid",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "isRead": false,
    "createdAt": "2026-03-18T11:25:00Z",
    "updatedAt": "2026-03-18T11:25:00Z"
  }
]
```

---

### 4. Get Alert Details

**Request:**
```http
GET /api/alerts/alert-001-uuid
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "id": "alert-001-uuid",
  "message": "Soil moisture critically low",
  "severity": "HIGH",
  "zoneId": "zone-001-uuid",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "isRead": false,
  "createdAt": "2026-03-18T11:25:00Z",
  "updatedAt": "2026-03-18T11:25:00Z"
}
```

---

### 5. Delete Alert

**Request:**
```http
DELETE /api/alerts/alert-001-uuid
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "id": "alert-001-uuid",
  "message": "Soil moisture critically low",
  "severity": "HIGH",
  "zoneId": "zone-001-uuid",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "isRead": false,
  "createdAt": "2026-03-18T11:25:00Z",
  "updatedAt": "2026-03-18T11:25:00Z"
}
```

---

## Irrigation Events

### 1. Create Irrigation Event

**Request:**
```http
POST /api/irrigation-events
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "zoneId": "zone-001-uuid",
  "deviceId": "device-001-uuid",
  "startTime": "2026-03-18T06:00:00Z",
  "endTime": "2026-03-18T06:30:00Z",
  "waterUsed": 150.5,
  "type": "SCHEDULED"
}
```

**Response (201):**
```json
{
  "id": "event-001-uuid",
  "zoneId": "zone-001-uuid",
  "deviceId": "device-001-uuid",
  "startTime": "2026-03-18T06:00:00Z",
  "endTime": "2026-03-18T06:30:00Z",
  "waterUsed": 150.5,
  "type": "SCHEDULED",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T11:30:00Z",
  "updatedAt": "2026-03-18T11:30:00Z"
}
```

---

### 2. List All Irrigation Events

**Request:**
```http
GET /api/irrigation-events
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
[
  {
    "id": "event-001-uuid",
    "zoneId": "zone-001-uuid",
    "deviceId": "device-001-uuid",
    "startTime": "2026-03-18T06:00:00Z",
    "endTime": "2026-03-18T06:30:00Z",
    "waterUsed": 150.5,
    "type": "SCHEDULED",
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "createdAt": "2026-03-18T11:30:00Z",
    "updatedAt": "2026-03-18T11:30:00Z"
  }
]
```

---

### 3. Get Irrigation Event Details

**Request:**
```http
GET /api/irrigation-events/event-001-uuid
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "id": "event-001-uuid",
  "zoneId": "zone-001-uuid",
  "deviceId": "device-001-uuid",
  "startTime": "2026-03-18T06:00:00Z",
  "endTime": "2026-03-18T06:30:00Z",
  "waterUsed": 150.5,
  "type": "SCHEDULED",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T11:30:00Z",
  "updatedAt": "2026-03-18T11:30:00Z"
}
```

---

### 4. Update Irrigation Event

**Request:**
```http
PUT /api/irrigation-events/event-001-uuid
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "waterUsed": 160.0
}
```

**Response (200):**
```json
{
  "id": "event-001-uuid",
  "zoneId": "zone-001-uuid",
  "deviceId": "device-001-uuid",
  "startTime": "2026-03-18T06:00:00Z",
  "endTime": "2026-03-18T06:30:00Z",
  "waterUsed": 160.0,
  "type": "SCHEDULED",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T11:30:00Z",
  "updatedAt": "2026-03-18T11:35:00Z"
}
```

---

### 5. Delete Irrigation Event

**Request:**
```http
DELETE /api/irrigation-events/event-001-uuid
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "id": "event-001-uuid",
  "zoneId": "zone-001-uuid",
  "deviceId": "device-001-uuid",
  "startTime": "2026-03-18T06:00:00Z",
  "endTime": "2026-03-18T06:30:00Z",
  "waterUsed": 160.0,
  "type": "SCHEDULED",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "createdAt": "2026-03-18T11:30:00Z",
  "updatedAt": "2026-03-18T11:35:00Z"
}
```

---

## Adafruit IO Integration

### 1. Get Adafruit Feeds

**Request:**
```http
GET /api/adafruit/feeds
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "feeds": [
    {
      "id": "123456",
      "name": "smart-irrigation.sensor-readings",
      "key": "sensor-readings",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-03-18T11:40:00Z"
    },
    {
      "id": "123457",
      "name": "smart-irrigation.irrigation-control",
      "key": "irrigation-control",
      "created_at": "2026-01-15T10:05:00Z",
      "updated_at": "2026-03-18T11:40:00Z"
    }
  ]
}
```

---

### 2. Get Adafruit Feed Data

**Request:**
```http
GET /api/adafruit/data?feed=temperature
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "data": [
    {
      "id": "456789",
      "value": "65.5",
      "created_at": "2026-03-18T11:35:00Z"
    },
    {
      "id": "456788",
      "value": "64.2",
      "created_at": "2026-03-18T11:30:00Z"
    },
    {
      "id": "456787",
      "value": "62.8",
      "created_at": "2026-03-18T11:25:00Z"
    }
  ]
}
```

---

### 3. Send Data to Adafruit Feed

**Request:**
```http
POST /api/adafruit/data
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "value": "68.3"
}
```

**Response (201):**
```json
{
  "id": "456790",
  "value": "68.3",
  "created_at": "2026-03-18T11:45:00Z"
}
```

---

### 4. Control Pump via Adafruit Feed

**Request:**
```http
POST /api/adafruit/pump
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "value": "1"
}
```

**Response (201):**
```json
{
  "id": "456791",
  "value": "1",
  "created_at": "2026-03-18T11:46:00Z"
}
```

**Note:** Value `1` turns pump ON, `0` turns pump OFF

---

## Data Export

### 1. Export as JSON

**Request:**
```http
GET /api/export?format=json&startDate=2026-03-01&endDate=2026-03-31&zoneId=zone-001-uuid
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "sensorReadings": [
    {
      "id": "reading-001",
      "sensorId": "sensor-001-uuid",
      "value": 65.5,
      "timestamp": "2026-03-18T11:35:00Z"
    }
  ],
  "irrigationEvents": [
    {
      "id": "event-001-uuid",
      "zoneId": "zone-001-uuid",
      "deviceId": "device-001-uuid",
      "startTime": "2026-03-18T06:00:00Z",
      "endTime": "2026-03-18T06:30:00Z",
      "waterUsed": 150.5,
      "type": "SCHEDULED"
    }
  ]
}
```

**Response Headers:**
```
Content-Type: application/json
Content-Disposition: attachment; filename="export-2026-03-18.json"
```

---

### 2. Export as CSV

**Request:**
```http
GET /api/export?format=csv&startDate=2026-03-01&endDate=2026-03-31
Authorization: Bearer <session-cookie>
```

**Response (200):**
```csv
SENSOR READINGS
id,sensorId,value,timestamp
reading-001,sensor-001-uuid,65.5,2026-03-18T11:35:00Z

IRRIGATION EVENTS
id,zoneId,deviceId,startTime,endTime,waterUsed,type
event-001-uuid,zone-001-uuid,device-001-uuid,2026-03-18T06:00:00Z,2026-03-18T06:30:00Z,150.5,SCHEDULED
```

**Response Headers:**
```
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="export-2026-03-18.csv"
```

---

### 3. Export with Sensor Filter

**Request:**
```http
GET /api/export?format=json&sensorId=sensor-001-uuid
Authorization: Bearer <session-cookie>
```

**Response (200):**
```json
{
  "sensorReadings": [
    {
      "id": "reading-001",
      "sensorId": "sensor-001-uuid",
      "value": 65.5,
      "timestamp": "2026-03-18T11:35:00Z"
    }
  ],
  "irrigationEvents": []
}
```

---

## Ordered Test Flow (Empty Database)

This is a step-by-step guide to test all API endpoints starting from an empty database. Save all resource IDs as you go.

### Step 1: Register User

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "testuser@example.com",
  "password": "TestPassword123!",
  "name": "Test User"
}
```

**✅ Save:** User ID = `{USER_ID}`

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

**✅ Note:** Session cookie auto-set. Use for all subsequent requests.

---

### Step 3: Create Zone 1

```http
POST /api/zones
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Front Garden",
  "description": "Front lawn area",
  "area": 50.5,
  "location": "North side"
}
```

**✅ Save:** Zone1 ID = `{ZONE_1_ID}`

---

### Step 4: Create Zone 2

```http
POST /api/zones
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Back Patio",
  "description": "Patio plants",
  "area": 30.0,
  "location": "South side"
}
```

**✅ Save:** Zone2 ID = `{ZONE_2_ID}`

---

### Step 5: List All Zones

```http
GET /api/zones
Authorization: Bearer <session-cookie>
```

**Expected:** 2 zones returned

---

### Step 6: Create Sensor 1 (Soil Moisture)

```http
POST /api/sensors
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Moisture Sensor 1",
  "type": "SOIL_MOISTURE",
  "zoneId": "{ZONE_1_ID}",
  "location": "Near main sprinkler"
}
```

**✅ Save:** Sensor1 ID = `{SENSOR_1_ID}`

---

### Step 7: Create Sensor 2 (Temperature)

```http
POST /api/sensors
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Temperature Sensor 1",
  "type": "TEMPERATURE",
  "zoneId": "{ZONE_1_ID}",
  "location": "Center of zone"
}
```

**✅ Save:** Sensor2 ID = `{SENSOR_2_ID}`

---

### Step 8: Create Sensor 3 (Zone 2)

```http
POST /api/sensors
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Moisture Sensor 2",
  "type": "SOIL_MOISTURE",
  "zoneId": "{ZONE_2_ID}",
  "location": "Patio center"
}
```

**✅ Save:** Sensor3 ID = `{SENSOR_3_ID}`

---

### Step 9: Get Sensor Details

```http
GET /api/sensors/{SENSOR_1_ID}
Authorization: Bearer <session-cookie>
```

**Expected:** Details for Sensor 1

---

### Step 10: Create Device 1 (Pump)

```http
POST /api/devices
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Main Pump",
  "type": "PUMP",
  "zoneId": "{ZONE_1_ID}"
}
```

**✅ Save:** Device1 ID = `{DEVICE_1_ID}`

---

### Step 11: Create Device 2 (Sprinkler)

```http
POST /api/devices
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Sprinkler Head 1",
  "type": "SPRINKLER",
  "zoneId": "{ZONE_2_ID}"
}
```

**✅ Save:** Device2 ID = `{DEVICE_2_ID}`

---

### Step 12: List All Devices

```http
GET /api/devices
Authorization: Bearer <session-cookie>
```

**Expected:** 2 devices returned

---

### Step 13: Create Profile 1 (Summer)

```http
POST /api/profiles
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Summer Garden",
  "description": "Summer watering profile",
  "minMoisture": 30,
  "maxMoisture": 70,
  "temperatureThreshold": 25
}
```

**✅ Save:** Profile1 ID = `{PROFILE_1_ID}`

---

### Step 14: Create Profile 2 (Winter)

```http
POST /api/profiles
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Winter Garden",
  "description": "Winter watering profile",
  "minMoisture": 50,
  "maxMoisture": 80,
  "temperatureThreshold": 5
}
```

**✅ Save:** Profile2 ID = `{PROFILE_2_ID}`

---

### Step 15: Update Profile 1

```http
PUT /api/profiles/{PROFILE_1_ID}
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "minMoisture": 35,
  "maxMoisture": 75
}
```

**Expected:** Profile1 updated with new moisture values

---

### Step 16: Create Schedule 1 (Morning)

```http
POST /api/schedules
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Morning Watering",
  "description": "Daily morning irrigation",
  "zoneId": "{ZONE_1_ID}",
  "profileId": "{PROFILE_1_ID}",
  "startTime": "06:00",
  "endTime": "08:00",
  "daysOfWeek": ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"],
  "isActive": true
}
```

**✅ Save:** Schedule1 ID = `{SCHEDULE_1_ID}`

---

### Step 17: Create Schedule 2 (Evening)

```http
POST /api/schedules
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "name": "Evening Watering",
  "description": "Daily evening irrigation",
  "zoneId": "{ZONE_2_ID}",
  "profileId": "{PROFILE_2_ID}",
  "startTime": "18:00",
  "endTime": "20:00",
  "daysOfWeek": ["SATURDAY", "SUNDAY"],
  "isActive": true
}
```

**✅ Save:** Schedule2 ID = `{SCHEDULE_2_ID}`

---

### Step 18: List All Schedules

```http
GET /api/schedules
Authorization: Bearer <session-cookie>
```

**Expected:** 2 schedules returned

---

### Step 19: Update Schedule 1

```http
PUT /api/schedules/{SCHEDULE_1_ID}
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "startTime": "05:30",
  "isActive": false
}
```

**Expected:** Schedule1 updated

---

### Step 20: Create Irrigation Event 1

```http
POST /api/irrigation-events
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "zoneId": "{ZONE_1_ID}",
  "deviceId": "{DEVICE_1_ID}",
  "startTime": "2026-03-18T06:00:00Z",
  "endTime": "2026-03-18T06:30:00Z",
  "waterUsed": 150.5,
  "type": "SCHEDULED"
}
```

**✅ Save:** Event1 ID = `{EVENT_1_ID}`

---

### Step 21: Create Irrigation Event 2

```http
POST /api/irrigation-events
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "zoneId": "{ZONE_2_ID}",
  "deviceId": "{DEVICE_2_ID}",
  "startTime": "2026-03-18T18:00:00Z",
  "endTime": "2026-03-18T18:45:00Z",
  "waterUsed": 120.0,
  "type": "SCHEDULED"
}
```

**✅ Save:** Event2 ID = `{EVENT_2_ID}`

---

### Step 22: Get Irrigation Event Details

```http
GET /api/irrigation-events/{EVENT_1_ID}
Authorization: Bearer <session-cookie>
```

**Expected:** Details for Event 1

---

### Step 23: Update Irrigation Event 1

```http
PUT /api/irrigation-events/{EVENT_1_ID}
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "waterUsed": 160.0
}
```

**Expected:** Event1 water usage updated

---

### Step 24: List All Irrigation Events

```http
GET /api/irrigation-events
Authorization: Bearer <session-cookie>
```

**Expected:** 2 events returned

---

### Step 25: Create Alert 1

```http
POST /api/alerts
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "message": "Soil moisture critically low in Front Garden",
  "severity": "HIGH",
  "zoneId": "{ZONE_1_ID}"
}
```

**✅ Save:** Alert1 ID = `{ALERT_1_ID}`

---

### Step 26: Create Alert 2

```http
POST /api/alerts
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "message": "Temperature above threshold in Back Patio",
  "severity": "MEDIUM",
  "zoneId": "{ZONE_2_ID}"
}
```

**✅ Save:** Alert2 ID = `{ALERT_2_ID}`

---

### Step 27: List All Alerts

```http
GET /api/alerts
Authorization: Bearer <session-cookie>
```

**Expected:** 2 alerts returned

---

### Step 28: List Alerts by Zone Filter

```http
GET /api/alerts?zoneId={ZONE_1_ID}&take=10
Authorization: Bearer <session-cookie>
```

**Expected:** 1 alert (Alert1 only)

---

### Step 29: Get Alert Details

```http
GET /api/alerts/{ALERT_1_ID}
Authorization: Bearer <session-cookie>
```

**Expected:** Details for Alert 1

---

### Step 30: Get Adafruit Feeds

```http
GET /api/adafruit/feeds
Authorization: Bearer <session-cookie>
```

**Expected:** List of available Adafruit IO feeds

---

### Step 31: Get Sensor Feed Data

```http
GET /api/adafruit/feeds/sensor-readings/data
Authorization: Bearer <session-cookie>
```

**Expected:** Recent sensor readings from Adafruit IO

---

### Step 32: Send Sensor Reading to Adafruit

```http
POST /api/adafruit/feeds/sensor-readings/data
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "value": "68.5"
}
```

**Expected:** Data sent to Adafruit IO feed

---

### Step 33: Control Pump via Adafruit (Turn ON)

```http
POST /api/adafruit/feeds/irrigation-control/data
Content-Type: application/json
Authorization: Bearer <session-cookie>

{
  "value": "1"
}
```

**Expected:** Pump control command sent (value 1 = ON)

---

### Step 34: Export As JSON (Full)

```http
GET /api/export?format=json
Authorization: Bearer <session-cookie>
```

**Expected:** JSON file download with all sensor readings and irrigation events

---

### Step 35: Export As CSV (Full)

```http
GET /api/export?format=csv
Authorization: Bearer <session-cookie>
```

**Expected:** CSV file download with two sections (readings + events)

---

### Step 36: Export With Date Range Filter

```http
GET /api/export?format=json&startDate=2026-03-01&endDate=2026-03-31
Authorization: Bearer <session-cookie>
```

**Expected:** JSON export filtered to March 2026 data

---

### Step 37: Export With Zone Filter

```http
GET /api/export?format=csv&zoneId={ZONE_1_ID}
Authorization: Bearer <session-cookie>
```

**Expected:** CSV export containing only Zone 1 data

---

### Step 38: Delete Alert 2

```http
DELETE /api/alerts/{ALERT_2_ID}
Authorization: Bearer <session-cookie>
```

**Expected:** Alert2 deleted

---

### Step 39: Delete Irrigation Event 2

```http
DELETE /api/irrigation-events/{EVENT_2_ID}
Authorization: Bearer <session-cookie>
```

**Expected:** Event2 deleted

---

### Step 40: Logout User

```http
POST /api/auth/logout
```

**Expected:** Session cookie cleared, user logged out

---

## Summary

- **Total API Endpoints:** 48+ examples
- **Test Flow Steps:** 40 ordered steps from empty database
- **Resource Types:** 8 (Users, Zones, Sensors, Devices, Profiles, Schedules, Alerts, Irrigation Events)
- **Integration:** Adafruit IO feeds and data control
- **Export Formats:** JSON and CSV with filtering
- **Authentication:** JWT-based with session cookies

All endpoints require authentication except `/api/auth/register` and `/api/auth/login`.

