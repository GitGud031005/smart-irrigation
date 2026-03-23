export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";
export type AlertType = "DEVICE_STATUS" | "PLANT_STATUS" | "IRRIGATION_EVENT";
export type AlertActor = "USER" | "SYSTEM" | "AI";

export interface Alert {
  id: string;
  zoneId?: string;
  message: string;
  severity: AlertSeverity;
  type: AlertType;
  actor: AlertActor;
  createdAt: Date | string;
}
