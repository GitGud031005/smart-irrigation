/*
  Warnings:

  - The primary key for the `ALERT` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `DEVICE` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `IRRIGATION_EVENT` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `IRRIGATION_PROFILE` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `SCHEDULE` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `SENSOR` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `SENSOR_READING` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `USER` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ZONE` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "ALERT" DROP CONSTRAINT "ALERT_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "DEVICE" DROP CONSTRAINT "DEVICE_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "IRRIGATION_EVENT" DROP CONSTRAINT "IRRIGATION_EVENT_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "SENSOR" DROP CONSTRAINT "SENSOR_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "SENSOR_READING" DROP CONSTRAINT "SENSOR_READING_sensorId_fkey";

-- DropForeignKey
ALTER TABLE "ZONE" DROP CONSTRAINT "ZONE_profileId_fkey";

-- DropForeignKey
ALTER TABLE "ZONE" DROP CONSTRAINT "ZONE_scheduleId_fkey";

-- DropForeignKey
ALTER TABLE "ZONE" DROP CONSTRAINT "ZONE_userId_fkey";

-- AlterTable
ALTER TABLE "ALERT" DROP CONSTRAINT "ALERT_pkey",
ALTER COLUMN "alert_id" DROP DEFAULT,
ALTER COLUMN "alert_id" SET DATA TYPE TEXT,
ALTER COLUMN "zoneId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ALERT_pkey" PRIMARY KEY ("alert_id");
DROP SEQUENCE "ALERT_alert_id_seq";

-- AlterTable
ALTER TABLE "DEVICE" DROP CONSTRAINT "DEVICE_pkey",
ALTER COLUMN "device_id" DROP DEFAULT,
ALTER COLUMN "device_id" SET DATA TYPE TEXT,
ALTER COLUMN "zoneId" SET DATA TYPE TEXT,
ADD CONSTRAINT "DEVICE_pkey" PRIMARY KEY ("device_id");
DROP SEQUENCE "DEVICE_device_id_seq";

-- AlterTable
ALTER TABLE "IRRIGATION_EVENT" DROP CONSTRAINT "IRRIGATION_EVENT_pkey",
ALTER COLUMN "event_id" DROP DEFAULT,
ALTER COLUMN "event_id" SET DATA TYPE TEXT,
ALTER COLUMN "zoneId" SET DATA TYPE TEXT,
ADD CONSTRAINT "IRRIGATION_EVENT_pkey" PRIMARY KEY ("event_id");
DROP SEQUENCE "IRRIGATION_EVENT_event_id_seq";

-- AlterTable
ALTER TABLE "IRRIGATION_PROFILE" DROP CONSTRAINT "IRRIGATION_PROFILE_pkey",
ALTER COLUMN "profile_id" DROP DEFAULT,
ALTER COLUMN "profile_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "IRRIGATION_PROFILE_pkey" PRIMARY KEY ("profile_id");
DROP SEQUENCE "IRRIGATION_PROFILE_profile_id_seq";

-- AlterTable
ALTER TABLE "SCHEDULE" DROP CONSTRAINT "SCHEDULE_pkey",
ALTER COLUMN "schedule_id" DROP DEFAULT,
ALTER COLUMN "schedule_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "SCHEDULE_pkey" PRIMARY KEY ("schedule_id");
DROP SEQUENCE "SCHEDULE_schedule_id_seq";

-- AlterTable
ALTER TABLE "SENSOR" DROP CONSTRAINT "SENSOR_pkey",
ALTER COLUMN "sensor_id" DROP DEFAULT,
ALTER COLUMN "sensor_id" SET DATA TYPE TEXT,
ALTER COLUMN "zoneId" SET DATA TYPE TEXT,
ADD CONSTRAINT "SENSOR_pkey" PRIMARY KEY ("sensor_id");
DROP SEQUENCE "SENSOR_sensor_id_seq";

-- AlterTable
ALTER TABLE "SENSOR_READING" DROP CONSTRAINT "SENSOR_READING_pkey",
ALTER COLUMN "reading_id" DROP DEFAULT,
ALTER COLUMN "reading_id" SET DATA TYPE TEXT,
ALTER COLUMN "sensorId" SET DATA TYPE TEXT,
ADD CONSTRAINT "SENSOR_READING_pkey" PRIMARY KEY ("reading_id");
DROP SEQUENCE "SENSOR_READING_reading_id_seq";

-- AlterTable
ALTER TABLE "USER" DROP CONSTRAINT "USER_pkey",
ALTER COLUMN "user_id" DROP DEFAULT,
ALTER COLUMN "user_id" SET DATA TYPE TEXT,
ADD CONSTRAINT "USER_pkey" PRIMARY KEY ("user_id");
DROP SEQUENCE "USER_user_id_seq";

-- AlterTable
ALTER TABLE "ZONE" DROP CONSTRAINT "ZONE_pkey",
ALTER COLUMN "zone_id" DROP DEFAULT,
ALTER COLUMN "zone_id" SET DATA TYPE TEXT,
ALTER COLUMN "userId" SET DATA TYPE TEXT,
ALTER COLUMN "profileId" SET DATA TYPE TEXT,
ALTER COLUMN "scheduleId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ZONE_pkey" PRIMARY KEY ("zone_id");
DROP SEQUENCE "ZONE_zone_id_seq";

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
