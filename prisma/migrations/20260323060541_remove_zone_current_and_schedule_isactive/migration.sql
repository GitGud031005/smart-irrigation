/*
  Warnings:

  - You are about to drop the column `is_active` on the `SCHEDULE` table. All the data in the column will be lost.
  - You are about to drop the column `current_humidity` on the `ZONE` table. All the data in the column will be lost.
  - You are about to drop the column `current_moisture` on the `ZONE` table. All the data in the column will be lost.
  - You are about to drop the column `current_temperature` on the `ZONE` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SCHEDULE" DROP COLUMN "is_active";

-- AlterTable
ALTER TABLE "ZONE" DROP COLUMN "current_humidity",
DROP COLUMN "current_moisture",
DROP COLUMN "current_temperature";
