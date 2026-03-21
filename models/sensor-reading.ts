export interface SensorReading {
  id: string;
  zoneId?: string;
  soilMoisture?: number;
  temperature?: number;
  humidity?: number;
  recordedAt: Date | string;
}
