/*
  Warnings:

  - Added the required column `actor` to the `ALERT` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `ALERT` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AlertSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('DEVICE_STATUS', 'PLANT_STATUS', 'IRRIGATION_EVENT');

-- CreateEnum
CREATE TYPE "AlertActor" AS ENUM ('USER', 'SYSTEM', 'AI');

-- AlterTable
ALTER TABLE "ALERT" ADD COLUMN     "actor" "AlertActor" NOT NULL,
ADD COLUMN     "severity" "AlertSeverity" NOT NULL DEFAULT 'INFO',
ADD COLUMN     "type" "AlertType" NOT NULL;
