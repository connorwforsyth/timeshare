// Import necessary dependencies and components
"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import {
	format,
	addDays,
	startOfDay,
	addHours,
	isToday,
	isTomorrow,
	differenceInDays,
	addMinutes,
	subDays,
} from "date-fns";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { motion, useAnimation } from "framer-motion";

// Define constants for the timeline
const HOURS = 24;
const MINUTES_PER_HOUR = 60;
const TOTAL_MINUTES = HOURS * MINUTES_PER_HOUR;
const SNAP_INTERVAL = 15;
const HOUR_WIDTH = 100;
const DAY_WIDTH = HOUR_WIDTH * HOURS;
const VISIBLE_HOURS = 12;

// New constants for scroll and switch amounts
const SCROLL_AMOUNT_HOURS = 1;
const SCROLL_AMOUNT_PX = SCROLL_AMOUNT_HOURS * HOUR_WIDTH;
const SWITCH_AMOUNT_DAYS = 1;

// DateSelector component for selecting a date
function DateSelector({
	focusedDate,
	onDateChange,
}: {
	focusedDate: Date;
	onDateChange: (date: Date | undefined) => void;
}) {
	return (
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
					onSelect={onDateChange}
					initialFocus
					className="bg-[#1e1e1e] text-white"
				/>
			</PopoverContent>
		</Popover>
	);
}

// TimelineControls component for scrolling the timeline
function TimelineControls({
	containerPosition,
	setContainerPosition,
}: {
	containerPosition: number;
	setContainerPosition: (position: number) => void;
}) {
	const handleScroll = (direction: "left" | "right") => {
		const scrollAmount = SCROLL_AMOUNT_PX;
		const newPosition =
			containerPosition + (direction === "left" ? scrollAmount : -scrollAmount);
		setContainerPosition(newPosition);
		const scrollContainer = document.querySelector(
			".timeline-scroll-container",
		);
		if (scrollContainer) {
			scrollContainer.scrollTo({
				left: -newPosition,
				behavior: "smooth",
			});
		}
	};

	return (
		<div className="flex space-x-2">
			<Button
				variant="outline"
				onClick={() => handleScroll("left")}
				className="border-gray-700 bg-[#1e1e1e] text-white hover:bg-[#2e2e2e] hover:text-white"
			>
				<ChevronLeftIcon className="mr-1 h-4 w-4" />-{SCROLL_AMOUNT_HOURS}Hour
			</Button>
			<Button
				variant="outline"
				onClick={() => handleScroll("right")}
				className="border-gray-700 bg-[#1e1e1e] text-white hover:bg-[#2e2e2e] hover:text-white"
			>
				+{SCROLL_AMOUNT_HOURS}Hour
				<ChevronRightIcon className="ml-1 h-4 w-4" />
			</Button>
		</div>
	);
}

// New TimeRangeSelector component
function TimeRangeSelector({
	startTime,
	endTime,
	formatTime,
	onDragStart,
	DAY_WIDTH,
	TOTAL_MINUTES,
	onMouseEnter,
	onMouseLeave,
}: {
	startTime: number;
	endTime: number;
	formatTime: (minutes: number) => string;
	onDragStart: (type: "start" | "end" | "middle", offset?: number) => void;
	DAY_WIDTH: number;
	TOTAL_MINUTES: number;
	onMouseEnter: () => void;
	onMouseLeave: () => void;
}) {
	return (
		<>
			{/* Render selected time range */}
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

			{/* Render start and end time handles */}
			{["start", "end"].map((handle) => (
				<div
					key={handle}
					className={`absolute bottom-0 top-0 w-1 cursor-ew-resize bg-blue-500`}
					style={{
						left: `${
							((handle === "start" ? startTime : endTime) / TOTAL_MINUTES) *
							DAY_WIDTH
						}px`,
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
	);
}

// Timeline component for selecting time range
function Timeline({
	focusedDate,
	startTime,
	endTime,
	setStartTime,
	setEndTime,
	formatTime,
	formatDate,
	containerPosition,
	setContainerPosition,
}: {
	focusedDate: Date;
	startTime: number | null;
	endTime: number | null;
	setStartTime: (time: number) => void;
	setEndTime: (time: number) => void;
	formatTime: (minutes: number) => string;
	formatDate: (date: Date) => string;
	containerPosition: number;
	setContainerPosition: (position: number) => void;
}) {
	// State for managing hover and dragging behavior
	const [hoverTime, setHoverTime] = useState<number | null>(null);
	const timelineRef = useRef<HTMLDivElement>(null);
	const [isDragging, setIsDragging] = useState<
		"start" | "end" | "middle" | "new" | null
	>(null);
	const [dragOffset, setDragOffset] = useState(0);
	const [mousePosition, setMousePosition] = useState<number | null>(null);

	const [isTimeRangeSelectorHovered, setIsTimeRangeSelectorHovered] =
		useState(false);

	const controls = useAnimation();

	// Function to snap time to the nearest interval
	const snapToInterval = (time: number) => {
		return Math.round(time / SNAP_INTERVAL) * SNAP_INTERVAL;
	};

	// Function to get time from mouse position
	const getTimeFromMousePosition = (e: MouseEvent | React.MouseEvent) => {
		if (!timelineRef.current) return null;
		const rect = timelineRef.current.getBoundingClientRect();
		const scrollContainer = timelineRef.current.closest(
			".timeline-scroll-container",
		);
		const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0;
		const x = e.clientX - rect.left + scrollLeft;
		const totalMinutes =
			Math.floor(x / HOUR_WIDTH) * 60 + ((x % HOUR_WIDTH) / HOUR_WIDTH) * 60;
		return snapToInterval(Math.round(totalMinutes));
	};

	// Effect for handling mouse events during dragging
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			if (isDragging) {
				e.preventDefault();
				const newTime = getTimeFromMousePosition(e);
				setHoverTime(newTime);

				// Update time range based on dragging behavior
				if (isDragging === "new") {
					setEndTime(Math.max(startTime!, newTime));
				} else if (isDragging === "start") {
					setStartTime(Math.min(newTime, endTime! - SNAP_INTERVAL));
				} else if (isDragging === "end") {
					setEndTime(Math.max(newTime, startTime! + SNAP_INTERVAL));
				} else if (isDragging === "middle") {
					const duration = endTime! - startTime!;
					const newStartTime = snapToInterval(newTime - dragOffset);
					setStartTime(newStartTime);
					setEndTime(newStartTime + duration);
				}
			}
		};

		const handleMouseUp = () => {
			setIsDragging(null);
			document.body.style.userSelect = "auto";
			document.body.style.cursor = "default";
		};

		// Add event listeners when dragging
		if (isDragging) {
			document.body.style.userSelect = "none";
			document.body.style.cursor = "grabbing";
			document.addEventListener("mousemove", handleMouseMove);
			document.addEventListener("mouseup", handleMouseUp);
		}

		// Clean up event listeners
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			document.removeEventListener("mouseup", handleMouseUp);
		};
	}, [isDragging, startTime, endTime, dragOffset, setStartTime, setEndTime]);

	// Add a new effect to track mouse position
	useEffect(() => {
		const handleMouseMove = (e: MouseEvent) => {
			const newTime = getTimeFromMousePosition(e);
			setMousePosition(newTime);
		};

		const timeline = timelineRef.current;
		if (timeline) {
			timeline.addEventListener("mousemove", handleMouseMove);
			timeline.addEventListener("mouseleave", () => setMousePosition(null));
		}

		return () => {
			if (timeline) {
				timeline.removeEventListener("mousemove", handleMouseMove);
				timeline.removeEventListener("mouseleave", () =>
					setMousePosition(null),
				);
			}
		};
	}, []);

	// Handle mouse down on the timeline
	const handleTimelineMouseDown = (e: React.MouseEvent) => {
		const clickTime = getTimeFromMousePosition(e);
		if (
			startTime !== null &&
			endTime !== null &&
			clickTime >= startTime &&
			clickTime <= endTime
		) {
			setDragOffset(clickTime - startTime);
			setIsDragging("middle");
		} else {
			setStartTime(clickTime);
			setEndTime(clickTime + SNAP_INTERVAL);
			setIsDragging("new");
		}
	};

	// Render timeline days
	const renderTimelineDays = () => {
		const days = [];
		for (let i = -1; i < 2; i++) {
			const currentDate = addDays(focusedDate, i);
			const dayStart = i * DAY_WIDTH;
			days.push(
				<div
					key={i}
					className="absolute bottom-0 top-0"
					style={{ left: `${dayStart}px`, width: `${DAY_WIDTH}px` }}
				>
					{/* Render day labels */}
					<div className="relative z-10 flex w-full border">
						<div className="sticky left-0 border px-2 py-1 text-sm text-neutral-200">
							{formatDate(currentDate)}
						</div>
					</div>
					{/* Render vertical lines for hours and quarter hours */}
					{Array.from({ length: HOURS * 4 + 1 }).map((_, index) => (
						<div
							key={index}
							className={`absolute bottom-0 top-0 w-px ${
								index % 4 === 0 ? "bg-neutral-600" : "bg-neutral-800"
							}`}
							style={{ left: `${index * (HOUR_WIDTH / 4)}px` }}
						/>
					))}
					{/* Render hour labels */}
					{Array.from({ length: HOURS }).map((_, hour) => (
						<div
							key={hour}
							className="absolute top-6 text-xs text-neutral-300"
							style={{ left: `${hour * HOUR_WIDTH + 1}px` }}
						>
							{hour === 0 || hour === 12 ? "12" : hour % 12}{" "}
							{hour < 12 ? "AM" : "PM"}
						</div>
					))}
				</div>,
			);
		}
		return days;
	};

	useEffect(() => {
		const handleScrollEnd = () => {
			const snappedPosition =
				Math.round(containerPosition / HOUR_WIDTH) * HOUR_WIDTH;
			setContainerPosition(snappedPosition);
			controls.start({ x: -snappedPosition });
		};

		const scrollContainer = document.querySelector(
			".timeline-scroll-container",
		);
		if (scrollContainer) {
			scrollContainer.addEventListener("scrollend", handleScrollEnd);
		}

		return () => {
			if (scrollContainer) {
				scrollContainer.removeEventListener("scrollend", handleScrollEnd);
			}
		};
	}, [containerPosition, controls, setContainerPosition]);

	// Render the timeline component
	return (
		<div className="custom-scrollbar timeline-scroll-container relative h-32 overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-900">
			<motion.div
				ref={timelineRef}
				className="absolute left-0 top-0 h-full"
				style={{ width: `${3 * DAY_WIDTH}px` }}
				animate={controls}
				initial={{ x: 0 }}
				transition={{ type: "spring", stiffness: 300, damping: 30 }}
				aria-label="Meeting time selector"
				role="slider"
				aria-valuemin={0}
				aria-valuemax={TOTAL_MINUTES}
				aria-valuenow={
					startTime !== null && endTime !== null ? endTime - startTime : 0
				}
				onMouseDown={handleTimelineMouseDown}
			>
				{renderTimelineDays()}
				{startTime !== null && endTime !== null && (
					<TimeRangeSelector
						onMouseEnter={() => setIsTimeRangeSelectorHovered(true)}
						onMouseLeave={() => setIsTimeRangeSelectorHovered(false)}
						startTime={startTime}
						endTime={endTime}
						formatTime={formatTime}
						onDragStart={(type, offset) => {
							if (type === "middle") {
								setDragOffset(offset || 0);
							}
							setIsDragging(type);
						}}
						DAY_WIDTH={DAY_WIDTH}
						TOTAL_MINUTES={TOTAL_MINUTES}
					/>
				)}
				{/* Update the hover time indicator */}
				{mousePosition !== null &&
					!isDragging &&
					!isTimeRangeSelectorHovered && (
						<div
							className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-red-500"
							style={{
								left: `${(mousePosition / TOTAL_MINUTES) * DAY_WIDTH}px`,
							}}
						>
							<div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform whitespace-nowrap rounded bg-[#1e1e1e] px-2 py-1 text-xs text-white">
								{formatTime(mousePosition)}
							</div>
						</div>
					)}
			</motion.div>
		</div>
	);
}

// Main component for the Infinite Time Picker
export default function InfiniteTimePicker() {
	// State for managing focused date and selected time range
	const [focusedDate, setFocusedDate] = useState<Date>(startOfDay(new Date()));
	const [startTime, setStartTime] = useState<number | null>(null);
	const [endTime, setEndTime] = useState<number | null>(null);
	const [containerPosition, setContainerPosition] = useState(0);

	// Handle date change
	const handleDateChange = (newDate: Date | undefined) => {
		if (newDate) {
			const daysDiff = differenceInDays(newDate, focusedDate);
			setFocusedDate(startOfDay(newDate));
			setContainerPosition((prev) => prev + daysDiff * 24 * HOUR_WIDTH);
		}
	};

	// Format time from minutes to string
	const formatTime = (minutes: number) => {
		const date = addMinutes(startOfDay(focusedDate), minutes);
		return format(date, "h:mm a");
	};

	// Format date to display "Today", "Tomorrow", or the day of the week
	const formatDate = (date: Date) => {
		if (format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"))
			return "Today";
		if (
			format(date, "yyyy-MM-dd") ===
			format(addMinutes(new Date(), 1440), "yyyy-MM-dd")
		)
			return "Tomorrow";
		return format(date, "EEEE d MMM");
	};

	// Get the selected time range as a formatted string
	const getSelectedTimeRange = () => {
		if (startTime === null || endTime === null) return "No time selected";
		const startDate = addMinutes(focusedDate, startTime);
		const endDate = addMinutes(focusedDate, endTime);
		const daysDiff = differenceInDays(endDate, startDate);

		if (daysDiff === 0) {
			return `${formatDate(startDate)}, ${format(
				startDate,
				"MMM d",
			)} - ${formatTime(startTime)} to ${formatTime(endTime)}`;
		} else {
			return `${formatDate(startDate)}, ${format(
				startDate,
				"MMM d",
			)} ${formatTime(startTime)} to ${formatDate(endDate)}, ${format(
				endDate,
				"MMM d",
			)} ${formatTime(endTime)}`;
		}
	};

	return (
		<Card className="w-full max-w-3xl bg-[#121212] text-white">
			<CardContent className="p-6">
				<div className="mb-4 flex items-center justify-between">
					<DateSelector
						focusedDate={focusedDate}
						onDateChange={handleDateChange}
					/>
					<TimelineControls
						containerPosition={containerPosition}
						setContainerPosition={setContainerPosition}
					/>
				</div>
				<Timeline
					focusedDate={focusedDate}
					startTime={startTime}
					endTime={endTime}
					setStartTime={setStartTime}
					setEndTime={setEndTime}
					formatTime={formatTime}
					formatDate={formatDate}
					containerPosition={containerPosition}
					setContainerPosition={setContainerPosition}
				/>
				{/* Selected Range */}
				<div className="mt-2 text-center text-sm font-medium">
					{getSelectedTimeRange()}
				</div>
			</CardContent>
			<style jsx global>{`
				.custom-scrollbar::-webkit-scrollbar {
					height: 0px;
				}
				.custom-scrollbar::-webkit-scrollbar-track {
					background: transparent;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb {
					background-color: rgba(255, 255, 255, 0.3);
					border-radius: 3px;
				}
				.custom-scrollbar::-webkit-scrollbar-thumb:hover {
					background-color: rgba(255, 255, 255, 0.5);
				}
			`}</style>
		</Card>
	);
}
