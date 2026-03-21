/*
  Warnings:

  - You are about to drop the column `humidity_sensor_id` on the `SENSOR_READING` table. All the data in the column will be lost.
  - You are about to drop the column `soil_moisture_sensor_id` on the `SENSOR_READING` table. All the data in the column will be lost.
  - You are about to drop the column `temperature_sensor_id` on the `SENSOR_READING` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "SENSOR_READING" DROP CONSTRAINT "SENSOR_READING_humidity_sensor_id_fkey";

-- DropForeignKey
ALTER TABLE "SENSOR_READING" DROP CONSTRAINT "SENSOR_READING_soil_moisture_sensor_id_fkey";

-- DropForeignKey
ALTER TABLE "SENSOR_READING" DROP CONSTRAINT "SENSOR_READING_temperature_sensor_id_fkey";

-- AlterTable
ALTER TABLE "SENSOR_READING" DROP COLUMN "humidity_sensor_id",
DROP COLUMN "soil_moisture_sensor_id",
DROP COLUMN "temperature_sensor_id",
ADD COLUMN     "zone_id" TEXT;

-- AddForeignKey
ALTER TABLE "SENSOR_READING" ADD CONSTRAINT "SENSOR_READING_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "ZONE"("zone_id") ON DELETE SET NULL ON UPDATE CASCADE;
