/**
 * AlertFactory — centralises construction of Alert input objects.
 *
 * Every place that calls `createAlert(...)` should go through one of these
 * named builders instead of hand-assembling magic strings.  This guarantees
 * that severity / type / actor combinations are consistent and easy to change
 * in a single place.
 */

import type { AlertSeverity, AlertType, AlertActor } from "@/models/alert";
import type { DeviceType } from "@/lib/generated/prisma/client";

export interface AlertInput {
  message:  string;
  severity: AlertSeverity;
  type:     AlertType;
  actor:    AlertActor;
  zoneId?:  string;
}

// ─── Device-type label map (single source of truth) ──────────────────────────

const DEVICE_TYPE_LABEL: Record<DeviceType, string> = {
  SOIL_MOISTURE_SENSOR:     "Soil Moisture Sensor",
  DHT20_TEMPERATURE_SENSOR: "DHT20 Temperature Sensor",
  DHT20_HUMIDITY_SENSOR:    "DHT20 Humidity Sensor",
  RELAY_MODULE:             "Relay Module",
  ESP32:                    "ESP32",
};

export function getDeviceLabel(deviceType: DeviceType | null | undefined, fallbackId: string): string {
  if (deviceType && DEVICE_TYPE_LABEL[deviceType]) return DEVICE_TYPE_LABEL[deviceType];
  return `Device ${fallbackId.slice(0, 8)}`;
}

// ─── Valid value sets for MQTT payload validation ─────────────────────────────

const VALID_SEVERITIES = new Set<string>(["INFO", "WARNING", "CRITICAL"]);
const VALID_TYPES      = new Set<string>(["DEVICE_STATUS", "PLANT_STATUS", "IRRIGATION_EVENT"]);
const VALID_ACTORS     = new Set<string>(["USER", "SYSTEM", "AI"]);

// ─── Factory methods ──────────────────────────────────────────────────────────

export const AlertFactory = {
  /**
   * Device went silent — produced by the Reaper cron.
   * The caller is responsible for supplying the message text.
   */
  deviceOffline(
    message: string,
    zoneId?: string | null,
  ): AlertInput {
    return {
      message,
      severity: "CRITICAL",
      type:     "DEVICE_STATUS",
      actor:    "SYSTEM",
      zoneId:   zoneId ?? undefined,
    };
  },

  /**
   * Parse a raw MQTT payload string from the audit-log feed.
   * Used by the SSE stream handler — accepts both JSON and plain text.
   */
  fromMqttPayload(raw: string): AlertInput {
    try {
      const obj = JSON.parse(raw);
      return {
        message:  typeof obj.message === "string" ? obj.message : raw,
        severity: VALID_SEVERITIES.has(obj.severity) ? (obj.severity as AlertSeverity) : "INFO",
        type:     VALID_TYPES.has(obj.type)           ? (obj.type     as AlertType)     : "DEVICE_STATUS",
        actor:    VALID_ACTORS.has(obj.actor)          ? (obj.actor    as AlertActor)    : "SYSTEM",
        zoneId:   typeof obj.zoneId   === "string"    ? obj.zoneId   : undefined,
      };
    } catch {
      return { message: raw, severity: "INFO", type: "DEVICE_STATUS", actor: "SYSTEM" };
    }
  },

  /**
   * Build an AlertInput from a validated gateway POST body.
   * Used by POST /api/alerts.
   */
  fromGatewayBody(body: {
    message:  string;
    severity?: string;
    type:     string;
    actor:    string;
    zoneId?:  string | null;
  }): AlertInput {
    return {
      message:  body.message,
      severity: VALID_SEVERITIES.has(body.severity ?? "") ? (body.severity as AlertSeverity) : "INFO",
      type:     body.type  as AlertType,
      actor:    body.actor as AlertActor,
      zoneId:   body.zoneId ?? undefined,
    };
  },
};
