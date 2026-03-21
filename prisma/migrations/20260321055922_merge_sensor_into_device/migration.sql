/*
  Warnings:

  - You are about to drop the column `watering_duration` on the `IRRIGATION_PROFILE` table. All the data in the column will be lost.
  - You are about to drop the column `sensorId` on the `SENSOR_READING` table. All the data in the column will be lost.
  - You are about to drop the `SENSOR` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SENSOR" DROP CONSTRAINT "SENSOR_zoneId_fkey";

-- DropForeignKey
ALTER TABLE "SENSOR_READING" DROP CONSTRAINT "SENSOR_READING_sensorId_fkey";

-- AlterTable
ALTER TABLE "IRRIGATION_PROFILE" DROP COLUMN "watering_duration";

-- AlterTable
ALTER TABLE "SENSOR_READING" DROP COLUMN "sensorId",
ADD COLUMN     "humidity_sensor_id" TEXT,
ADD COLUMN     "soil_moisture_sensor_id" TEXT,
ADD COLUMN     "temperature_sensor_id" TEXT;

-- DropTable
DROP TABLE "SENSOR";

-- AddForeignKey
ALTER TABLE "SENSOR_READING" ADD CONSTRAINT "SENSOR_READING_soil_moisture_sensor_id_fkey" FOREIGN KEY ("soil_moisture_sensor_id") REFERENCES "DEVICE"("device_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SENSOR_READING" ADD CONSTRAINT "SENSOR_READING_temperature_sensor_id_fkey" FOREIGN KEY ("temperature_sensor_id") REFERENCES "DEVICE"("device_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SENSOR_READING" ADD CONSTRAINT "SENSOR_READING_humidity_sensor_id_fkey" FOREIGN KEY ("humidity_sensor_id") REFERENCES "DEVICE"("device_id") ON DELETE SET NULL ON UPDATE CASCADE;
