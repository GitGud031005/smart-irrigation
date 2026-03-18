// Zone model - irrigation area with real-time sensor data (Class: Zone)
// DB Table: ZONE (zone_id, name, current_moisture, current_humidity, current_temperature, user_id, profile_id, schedule_id)

export interface Zone {
	zone_id: number;
	name: string;
	tag: string;
	profile_id: number;
	schedule_id: number;
	user_id: number;
}
