-- Migration: add zone_name denormalized column to Alert (keep zoneId FK)
ALTER TABLE "ALERT" ADD COLUMN "zone_name" TEXT;
