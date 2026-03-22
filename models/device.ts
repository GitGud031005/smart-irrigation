export enum DeviceStatus {
  ACTIVE = "ACTIVE",
  OFFLINE = "OFFLINE",
  ERROR = "ERROR",
}

export interface Device {
  id: string;
  deviceType?: string;
  zoneId?: string;
  lastActiveAt?: Date | string;
  status: DeviceStatus;
}
