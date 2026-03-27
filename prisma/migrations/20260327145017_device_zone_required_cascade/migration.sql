/*
  Warnings:

  - Made the column `zoneId` on table `DEVICE` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "DEVICE" DROP CONSTRAINT "DEVICE_zoneId_fkey";

-- AlterTable
ALTER TABLE "DEVICE" ALTER COLUMN "zoneId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "DEVICE" ADD CONSTRAINT "DEVICE_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "ZONE"("zone_id") ON DELETE CASCADE ON UPDATE CASCADE;
