// timePickerConstants.ts

export const HOURS = 24;
export const MINUTES_PER_HOUR = 60;
export const TOTAL_MINUTES = HOURS * MINUTES_PER_HOUR;
export const SNAP_INTERVAL = 15;
export const HOUR_WIDTH = 100;
export const DAY_WIDTH = HOUR_WIDTH * HOURS;
export const SCROLL_AMOUNT_HOURS = 1;
export const SCROLL_AMOUNT_PX = SCROLL_AMOUNT_HOURS * HOUR_WIDTH;

export type TimePickerState = {
	focusedDate: Date;
	startTime: number | null;
	endTime: number | null;
	containerPosition: number;
};

export type TimePickerAction =
	| { type: "SET_DATE"; payload: Date }
	| { type: "SET_START_TIME"; payload: number }
	| { type: "SET_END_TIME"; payload: number }
	| { type: "SET_CONTAINER_POSITION"; payload: number };
