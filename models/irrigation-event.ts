export interface IrrigationEvent {
  id: string;
  zoneId?: string;
  startTime: Date | string;
  endTime: Date | string;
  duration: number;
}
