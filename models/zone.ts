export interface Zone {
  id: string;
  name: string;
  userId?: string;
  profileId?: string;
  scheduleId?: string;
  currentMoisture: number;
  currentHumidity: number;
  currentTemperature: number;
}
