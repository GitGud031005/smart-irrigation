export enum IrrigationMode {
  AUTO = "AUTO",
  MANUAL = "MANUAL",
  AI = "AI",
}

export interface IrrigationProfile {
  id: string;
  name?: string;
  minMoisture: number;
  maxMoisture: number;
  mode: IrrigationMode;
}
