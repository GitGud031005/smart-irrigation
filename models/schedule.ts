export type DayOfWeek =
  | "Monday" | "Tuesday" | "Wednesday"
  | "Thursday" | "Friday" | "Saturday" | "Sunday";

export const ALL_DAYS: DayOfWeek[] = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

export interface TimeSlot {
  id: string;
  startTime: string;     // "HH:MM"
  days: DayOfWeek[];
  duration: number;      // seconds
  scheduleId: string;
}

export interface Schedule {
  id: string;
  name: string;
  timeSlots?: TimeSlot[];
}
