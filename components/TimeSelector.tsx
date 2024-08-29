"use client";
import React, { useReducer, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import Timeline from "./timeline";
import {
	TimePickerAction,
	TimePickerState,
	timePickerConstants,
} from "@/types/timetypes";

const {
	HOURS,
	MINUTES_PER_HOUR,
	TOTAL_MINUTES,
	SNAP_INTERVAL,
	HOUR_WIDTH,
	DAY_WIDTH,
	SCROLL_AMOUNT_HOURS,
	SCROLL_AMOUNT_PX,
} = timePickerConstants;
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	format,
	startOfDay,
	addMinutes,
	differenceInDays,
	eachDayOfInterval,
	subDays,
	addDays,
	isSameDay,
	isValid,
} from "date-fns";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { motion, useAnimation } from "framer-motion";

// Update reducer
const timePickerReducer = (
	state: TimePickerState,
	action: TimePickerAction,
): TimePickerState => {
	switch (action.type) {
		case "SET_DATE_RANGE":
			return { ...state, dateRange: action.payload };
		case "SET_START_TIME":
			return { ...state, startTime: action.payload };
		case "SET_END_TIME":
			return { ...state, endTime: action.payload };
		case "SET_CONTAINER_POSITION":
			return { ...state, containerPosition: action.payload };
		default:
			return state;
	}
};

// Custom Hooks
const useTimeFormatter = (focusedDate: Date) => {
	const formatTime = useCallback(
		(minutes: number) => {
			const date = addMinutes(startOfDay(focusedDate), minutes);
			return isValid(date) ? format(date, "h:mm a") : "Invalid Time";
		},
		[focusedDate],
	);

	const formatDate = useCallback((date: Date | null | undefined) => {
		if (!date || !isValid(date)) return "Invalid Date";

		const today = new Date();
		const tomorrow = addDays(today, 1);

		if (isSameDay(date, today)) return "Today";
		if (isSameDay(date, tomorrow)) return "Tomorrow";
		return format(date, "EEEE d MMM");
	}, []);

	return { formatTime, formatDate };
};

// Components
const DateSelector = React.memo(
	({
		focusedDate,
		onDateChange,
	}: {
		focusedDate: Date;
		onDateChange: (date: Date) => void;
	}) => (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					className="w-[240px] justify-start border-gray-700 bg-[#1e1e1e] text-left font-normal text-white hover:bg-[#2e2e2e] hover:text-white"
				>
					<CalendarIcon className="mr-2 h-4 w-4" />
					{format(focusedDate, "PPP")}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-auto border-gray-700 bg-[#1e1e1e] p-0"
				align="start"
			>
				<Calendar
					mode="single"
					selected={focusedDate}
					onSelect={(date) => date && onDateChange(date)}
					initialFocus
					className="bg-[#1e1e1e] text-white"
				/>
			</PopoverContent>
		</Popover>
	),
);

const TimelineControls = React.memo(
	({ onScroll }: { onScroll: (direction: "left" | "right") => void }) => (
		<div className="flex space-x-2">
			<Button
				variant="outline"
				onClick={() => onScroll("right")}
				className="border-gray-700 bg-[#1e1e1e] text-white hover:bg-[#2e2e2e] hover:text-white"
			>
				<ChevronLeftIcon className="mr-1 h-4 w-4" />
				{SCROLL_AMOUNT_HOURS}Hour
			</Button>
			<Button
				variant="outline"
				onClick={() => onScroll("left")}
				className="border-gray-700 bg-[#1e1e1e] text-white hover:bg-[#2e2e2e] hover:text-white"
			>
				{SCROLL_AMOUNT_HOURS}Hour
				<ChevronRightIcon className="ml-1 h-4 w-4" />
			</Button>
		</div>
	),
);

const TimeRangeSelector = React.memo(
	({
		startTime,
		endTime,
		formatTime,
		onDragStart,
		onMouseEnter,
		onMouseLeave,
	}: {
		startTime: number;
		endTime: number;
		formatTime: (minutes: number) => string;
		onDragStart: (type: "start" | "end" | "middle", offset?: number) => void;
		onMouseEnter: () => void;
		onMouseLeave: () => void;
	}) => (
		<>
			<div
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
				className="absolute bottom-0 top-0 flex cursor-move items-center justify-center bg-blue-500 opacity-30"
				style={{
					left: `${(startTime / TOTAL_MINUTES) * DAY_WIDTH}px`,
					width: `${((endTime - startTime) / TOTAL_MINUTES) * DAY_WIDTH}px`,
				}}
				onMouseDown={(e) => {
					e.stopPropagation();
					const offset = (e.nativeEvent.offsetX / DAY_WIDTH) * TOTAL_MINUTES;
					onDragStart("middle", offset);
				}}
			>
				<div className="sr-only">
					Selected time: {formatTime(startTime)} - {formatTime(endTime)}
				</div>
			</div>
			{["start", "end"].map((handle) => (
				<div
					key={handle}
					className={`absolute bottom-0 top-0 w-1 cursor-ew-resize bg-blue-500`}
					style={{
						left: `${((handle === "start" ? startTime : endTime) / TOTAL_MINUTES) * DAY_WIDTH}px`,
					}}
					onMouseDown={(e) => {
						e.stopPropagation();
						onDragStart(handle as "start" | "end");
					}}
					role="slider"
					aria-label={`${handle} time`}
					aria-valuemin={0}
					aria-valuemax={TOTAL_MINUTES}
					aria-valuenow={handle === "start" ? startTime : endTime}
				/>
			))}
		</>
	),
);

// Main component
const InfiniteTimePicker: React.FC = () => {
	const [state, dispatch] = useReducer(timePickerReducer, {
		dateRange: eachDayOfInterval({
			start: subDays(new Date(), 3),
			end: addDays(new Date(), 3),
		}),
		startTime: null,
		endTime: null,
		containerPosition: 0,
		focusedDate: new Date(), // Add this line
	});

	const { formatTime, formatDate } = useTimeFormatter(state.dateRange[0]);
	const controls = useAnimation();

	const handleDateChange = useCallback(
		(newDate: Date) => {
			const daysDiff = differenceInDays(newDate, state.dateRange[0]);
			dispatch({
				type: "SET_DATE_RANGE",
				payload: [newDate, ...state.dateRange],
			});
			dispatch({
				type: "SET_CONTAINER_POSITION",
				payload: state.containerPosition + daysDiff * 24 * HOUR_WIDTH,
			});
		},
		[state.dateRange[0], state.containerPosition],
	);

	const handleScroll = useCallback(
		(direction: "left" | "right") => {
			const newPosition =
				state.containerPosition +
				(direction === "left" ? SCROLL_AMOUNT_PX : -SCROLL_AMOUNT_PX);
			dispatch({ type: "SET_CONTAINER_POSITION", payload: newPosition });
			controls.start({ x: -newPosition });

			// Load more days if needed
			if (direction === "left" && newPosition > DAY_WIDTH) {
				const newStartDate = subDays(state.dateRange[0], 1);
				dispatch({
					type: "SET_DATE_RANGE",
					payload: [newStartDate, ...state.dateRange],
				});
			} else if (
				direction === "right" &&
				newPosition < -DAY_WIDTH * (state.dateRange.length - 7)
			) {
				const newEndDate = addDays(
					state.dateRange[state.dateRange.length - 1],
					1,
				);
				dispatch({
					type: "SET_DATE_RANGE",
					payload: [...state.dateRange, newEndDate],
				});
			}
		},
		[state.containerPosition, state.dateRange, controls],
	);

	const selectedTimeRange = useMemo(() => {
		if (state.startTime === null || state.endTime === null)
			return "No time selected";
		const startDate = addMinutes(state.dateRange[0], state.startTime);
		const endDate = addMinutes(
			state.dateRange[state.dateRange.length - 1],
			state.endTime,
		);
		const daysDiff = differenceInDays(endDate, startDate);

		if (daysDiff === 0) {
			return `${formatDate(startDate)}, ${format(startDate, "MMM d")} - ${formatTime(state.startTime)} to ${formatTime(state.endTime)}`;
		} else {
			return `${formatDate(startDate)}, ${format(startDate, "MMM d")} ${formatTime(state.startTime)} to ${formatDate(endDate)}, ${format(endDate, "MMM d")} ${formatTime(state.endTime)}`;
		}
	}, [state.startTime, state.endTime, state.dateRange, formatDate, formatTime]);

	return (
		<Card className="w-full max-w-3xl bg-[#121212] text-white">
			<CardContent className="p-6">
				<div className="mb-4 flex items-center justify-between">
					<DateSelector
						focusedDate={state.dateRange[0]}
						onDateChange={handleDateChange}
					/>
					<TimelineControls onScroll={handleScroll} />
				</div>
				<Timeline
					state={state}
					dispatch={dispatch}
					formatTime={formatTime}
					formatDate={formatDate}
					controls={controls}
					dateRange={state.dateRange}
				/>
				<div className="mt-2 text-center text-sm font-medium">
					{selectedTimeRange}
				</div>
			</CardContent>
		</Card>
	);
};

export default InfiniteTimePicker;
