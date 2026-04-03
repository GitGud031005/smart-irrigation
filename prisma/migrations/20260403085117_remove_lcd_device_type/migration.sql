/*
  Warnings:

  - The values [LCD_16X2_DISPLAY] on the enum `DeviceType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DeviceType_new" AS ENUM ('SOIL_MOISTURE_SENSOR', 'DHT20_TEMPERATURE_SENSOR', 'DHT20_HUMIDITY_SENSOR', 'RELAY_MODULE', 'ESP32');
ALTER TABLE "DEVICE" ALTER COLUMN "device_type" TYPE "DeviceType_new" USING ("device_type"::text::"DeviceType_new");
ALTER TYPE "DeviceType" RENAME TO "DeviceType_old";
ALTER TYPE "DeviceType_new" RENAME TO "DeviceType";
DROP TYPE "public"."DeviceType_old";
COMMIT;
