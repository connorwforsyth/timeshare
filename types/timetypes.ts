// timePickerConstants.ts

export const timePickerConstants = {
	HOURS: 24,
	MINUTES_PER_HOUR: 60,
	TOTAL_MINUTES: 24 * 60,
	SNAP_INTERVAL: 15,
	HOUR_WIDTH: 100,
	DAY_WIDTH: 100 * 24,
	SCROLL_AMOUNT_HOURS: 1,
	SCROLL_AMOUNT_PX: 1 * 100,
};

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
