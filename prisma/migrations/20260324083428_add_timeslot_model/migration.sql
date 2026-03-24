/*
  Warnings:

  - You are about to drop the column `cron_expression` on the `SCHEDULE` table. All the data in the column will be lost.
  - Added the required column `name` to the `SCHEDULE` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SCHEDULE" DROP COLUMN "cron_expression",
ADD COLUMN     "name" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "TIME_SLOT" (
    "timeslot_id" TEXT NOT NULL,
    "start_time" TEXT NOT NULL,
    "days" TEXT[],
    "duration" INTEGER NOT NULL,
    "schedule_id" TEXT NOT NULL,

    CONSTRAINT "TIME_SLOT_pkey" PRIMARY KEY ("timeslot_id")
);

-- AddForeignKey
ALTER TABLE "TIME_SLOT" ADD CONSTRAINT "TIME_SLOT_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "SCHEDULE"("schedule_id") ON DELETE CASCADE ON UPDATE CASCADE;
