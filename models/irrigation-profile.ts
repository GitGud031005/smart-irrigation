// IrrigationProfile model - operational thresholds and safety limits (Class: IrrigationProfile)
// DB Table: IRRIGATION_PROFILE (profile_id, name, min_moisture, max_moisture, watering_duration)

export interface IrrigationProfile {
	profile_id: number;
	name: string;
	min_moisture: number;
	max_moisture: number;
	watering_duration: number;
}
