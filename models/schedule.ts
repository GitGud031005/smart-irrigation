// Schedule model - automated watering windows using cron expressions (Class: Schedule)
// DB Table: SCHEDULE (schedule_id, cron_expression, is_active)

export interface Schedule {
	schedule_id: number;
	cron_expression: string;
	active: boolean;
}
