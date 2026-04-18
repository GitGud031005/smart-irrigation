/**
 * AuditPayloadFactory — builds the JSON object published to the Adafruit IO
 * `audit-log` MQTT feed.
 *
 * Every publisher (Reaper cron, gateway, future services) must use this factory
 * so the payload shape is always consistent with what the SSE stream handler and
 * the IoT gateway both expect:
 *
 *   { zone, severity, type, actor, message, ts }
 */

import type { AlertSeverity, AlertType, AlertActor } from "@/models/alert";
import type { AlertInput } from "./alert-factory";

export interface AuditPayload {
  zone:     string;
  severity: AlertSeverity;
  type:     AlertType;
  actor:    AlertActor;
  message:  string;
  ts:       string; // ISO-8601
}

export const AuditPayloadFactory = {
  /**
   * Build from a saved alert + the human-readable zone name.
   * `createdAt` can be a Date or ISO string (Prisma returns Date on server).
   */
  fromAlert(
    input: AlertInput,
    zoneName: string,
    createdAt: Date | string,
  ): AuditPayload {
    return {
      zone:     zoneName,
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
