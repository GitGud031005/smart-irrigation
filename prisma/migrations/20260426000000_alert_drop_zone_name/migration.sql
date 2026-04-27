-- Migration: remove zone_name from Alert, use zoneId FK only
ALTER TABLE "ALERT" DROP COLUMN IF EXISTS "zone_name";
