// IrrigationEvent model - logs of irrigation actions
// DB Table: IRRIGATION_EVENT (event_id, zone_id, start_time, end_time, duration, trigger_type)

export type EventSource = "manual" | "ai";

export type EventType = "watering" | "mist" | "fertilize";

export interface IrrigationEvent {
	id: number;
	title: string;
	zone: number;
	date: string;
	start: string;
	duration: number;
	type: EventType;
	source: EventSource;
}
