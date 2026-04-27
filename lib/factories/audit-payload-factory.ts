/**
 * AuditPayloadFactory — builds the JSON object published to the Adafruit IO
 * `audit-log` MQTT feed.
 *
 * Every publisher (Reaper cron, gateway, future services) must use this factory
 * so the payload shape is always consistent with what the SSE stream handler and
 * the IoT gateway both expect:
 *
 *   { alertId?, zoneId?, severity, type, actor, message, ts }
 *
 * Zone names are intentionally NOT included — the audit-log page resolves
 * them from the zones map using zoneId.
 */

import type { AlertSeverity, AlertType, AlertActor } from "@/models/alert";
import type { AlertInput } from "./alert-factory";

export interface AuditPayload {
  alertId?: string;  // set when already persisted — SSE stream reuses it
  zoneId?:  string;
  severity: AlertSeverity;
  type:     AlertType;
  actor:    AlertActor;
  message:  string;
  ts:       string; // ISO-8601
}

export const AuditPayloadFactory = {
  /**
   * Build from a saved alert input + its persisted metadata.
   * `createdAt` can be a Date or ISO string (Prisma returns Date on server).
   * Pass `alertId` so the SSE stream can reuse the existing DB record.
   */
  fromAlert(
    input: AlertInput,
    createdAt: Date | string,
    alertId?: string,
  ): AuditPayload {
    return {
      alertId:  alertId,
      zoneId:   input.zoneId,
      severity: input.severity,
      type:     input.type,
      actor:    input.actor,
      message:  input.message,
      ts: createdAt instanceof Date
        ? createdAt.toISOString()
        : new Date().toISOString(),
    };
  },

  /**
   * Serialise to the JSON string that goes over the wire to Adafruit IO.
   */
  serialize(payload: AuditPayload): string {
    return JSON.stringify(payload);
  },
};
