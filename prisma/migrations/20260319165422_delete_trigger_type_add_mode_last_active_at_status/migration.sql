/*
  Warnings:

  - You are about to drop the column `trigger_type` on the `IRRIGATION_EVENT` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "IrrigationMode" AS ENUM ('AUTO', 'MANUAL', 'AI');

-- CreateEnum
CREATE TYPE "DeviceStatus" AS ENUM ('ACTIVE', 'OFFLINE', 'ERROR');

-- AlterTable
ALTER TABLE "DEVICE" ADD COLUMN     "last_active_at" TIMESTAMP(3),
ADD COLUMN     "status" "DeviceStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "IRRIGATION_EVENT" DROP COLUMN "trigger_type";

-- AlterTable
ALTER TABLE "IRRIGATION_PROFILE" ADD COLUMN     "mode" "IrrigationMode" NOT NULL DEFAULT 'AUTO';
