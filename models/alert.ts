export interface Alert {
  id: string;
  zoneId?: string;
  message: string;
  createdAt: Date | string;
}
