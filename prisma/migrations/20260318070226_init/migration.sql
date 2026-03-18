-- CreateTable
CREATE TABLE "USER" (
    "user_id" BIGSERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,

    CONSTRAINT "USER_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "IRRIGATION_PROFILE" (
    "profile_id" BIGSERIAL NOT NULL,
    "name" TEXT,
    "min_moisture" DOUBLE PRECISION NOT NULL,
    "max_moisture" DOUBLE PRECISION NOT NULL,
    "watering_duration" INTEGER NOT NULL,

    CONSTRAINT "IRRIGATION_PROFILE_pkey" PRIMARY KEY ("profile_id")
);

-- CreateTable
CREATE TABLE "SCHEDULE" (
    "schedule_id" BIGSERIAL NOT NULL,
    "cron_expression" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SCHEDULE_pkey" PRIMARY KEY ("schedule_id")
);

-- CreateTable
CREATE TABLE "ZONE" (
    "zone_id" BIGSERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "userId" BIGINT,
    "profileId" BIGINT,
    "scheduleId" BIGINT,
    "current_moisture" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "current_humidity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "current_temperature" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "ZONE_pkey" PRIMARY KEY ("zone_id")
);

-- CreateTable
CREATE TABLE "SENSOR" (
    "sensor_id" BIGSERIAL NOT NULL,
    "sensor_type" TEXT,
    "model" TEXT,
    "zoneId" BIGINT,

    CONSTRAINT "SENSOR_pkey" PRIMARY KEY ("sensor_id")
);

-- CreateTable
CREATE TABLE "DEVICE" (
    "device_id" BIGSERIAL NOT NULL,
    "device_type" TEXT,
    "zoneId" BIGINT,

    CONSTRAINT "DEVICE_pkey" PRIMARY KEY ("device_id")
);

-- CreateTable
CREATE TABLE "SENSOR_READING" (
    "reading_id" BIGSERIAL NOT NULL,
    "sensorId" BIGINT,
    "soil_moisture" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SENSOR_READING_pkey" PRIMARY KEY ("reading_id")
);

-- CreateTable
CREATE TABLE "IRRIGATION_EVENT" (
    "event_id" BIGSERIAL NOT NULL,
    "zoneId" BIGINT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration" INTEGER,
    "trigger_type" TEXT,

    CONSTRAINT "IRRIGATION_EVENT_pkey" PRIMARY KEY ("event_id")
);

-- CreateTable
CREATE TABLE "ALERT" (
    "alert_id" BIGSERIAL NOT NULL,
    "zoneId" BIGINT,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ALERT_pkey" PRIMARY KEY ("alert_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "USER_email_key" ON "USER"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ZONE_scheduleId_key" ON "ZONE"("scheduleId");

-- AddForeignKey
ALTER TABLE "ZONE" ADD CONSTRAINT "ZONE_userId_fkey" FOREIGN KEY ("userId") REFERENCES "USER"("user_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZONE" ADD CONSTRAINT "ZONE_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "IRRIGATION_PROFILE"("profile_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ZONE" ADD CONSTRAINT "ZONE_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "SCHEDULE"("schedule_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SENSOR" ADD CONSTRAINT "SENSOR_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ZONE"("zone_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DEVICE" ADD CONSTRAINT "DEVICE_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ZONE"("zone_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SENSOR_READING" ADD CONSTRAINT "SENSOR_READING_sensorId_fkey" FOREIGN KEY ("sensorId") REFERENCES "SENSOR"("sensor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IRRIGATION_EVENT" ADD CONSTRAINT "IRRIGATION_EVENT_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ZONE"("zone_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ALERT" ADD CONSTRAINT "ALERT_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ZONE"("zone_id") ON DELETE SET NULL ON UPDATE CASCADE;
