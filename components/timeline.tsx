import React, { useRef, useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { TimePickerAction, TimePickerState } from "@/types/timetypes";
import { addDays, eachDayOfInterval, subDays } from "date-fns";
import TimeRangeSelector from "./RangeSelector";
import { timePickerConstants } from "@/types/timetypes";
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

const Timeline: React.FC<{
	state: TimePickerState;
	dispatch: React.Dispatch<TimePickerAction>;
	formatTime: (minutes: number) => string;
	formatDate: (date: Date) => string;
	controls: any; // Consider using a more specific type from framer-motion
	dateRange: Date[];
}> = React.memo(
	({ state, dispatch, formatTime, formatDate, controls, dateRange }) => {
		const timelineRef = useRef<HTMLDivElement>(null);
		const [isDragging, setIsDragging] = useState<
			"start" | "end" | "middle" | "new" | null
		>(null);
		const [dragOffset, setDragOffset] = useState(0);
		const [mousePosition, setMousePosition] = useState<number | null>(null);
		const [isTimeRangeSelectorHovered, setIsTimeRangeSelectorHovered] =
			useState(false);

		const snapToInterval = useCallback((time: number) => {
			return Math.round(time / SNAP_INTERVAL) * SNAP_INTERVAL;
		}, []);

		const getTimeFromMousePosition = useCallback(
			(e: MouseEvent | React.MouseEvent) => {
				if (!timelineRef.current) return null;
				const rect = timelineRef.current.getBoundingClientRect();
				const scrollContainer = timelineRef.current.closest(
					".timeline-scroll-container",
				);
				const scrollLeft = scrollContainer ? scrollContainer.scrollLeft : 0;
				const x = e.clientX - rect.left + scrollLeft;
				const totalMinutes =
					Math.floor(x / HOUR_WIDTH) * 60 +
					((x % HOUR_WIDTH) / HOUR_WIDTH) * 60;
				return snapToInterval(Math.round(totalMinutes));
			},
			[snapToInterval],
		);

		useEffect(() => {
			const handleMouseMove = (e: MouseEvent) => {
				if (isDragging) {
					e.preventDefault();
					const newTime = getTimeFromMousePosition(e);
					if (newTime === null) return;

					if (isDragging === "new") {
						dispatch({
							type: "SET_END_TIME",
							payload: Math.max(state.startTime!, newTime),
						});
					} else if (isDragging === "start") {
						dispatch({
							type: "SET_START_TIME",
							payload: Math.min(newTime, state.endTime! - SNAP_INTERVAL),
						});
					} else if (isDragging === "end") {
						dispatch({
							type: "SET_END_TIME",
							payload: Math.max(newTime, state.startTime! + SNAP_INTERVAL),
						});
					} else if (isDragging === "middle") {
						const duration = state.endTime! - state.startTime!;
						const newStartTime = snapToInterval(newTime - dragOffset);
						dispatch({ type: "SET_START_TIME", payload: newStartTime });
						dispatch({
							type: "SET_END_TIME",
							payload: newStartTime + duration,
						});
					}
				}
			};

			const handleMouseUp = () => {
				setIsDragging(null);
				document.body.style.userSelect = "auto";
				document.body.style.cursor = "default";
			};

			if (isDragging) {
				document.body.style.userSelect = "none";
				document.body.style.cursor = "grabbing";
				document.addEventListener("mousemove", handleMouseMove);
				document.addEventListener("mouseup", handleMouseUp);
			}

			return () => {
				document.removeEventListener("mousemove", handleMouseMove);
				document.removeEventListener("mouseup", handleMouseUp);
			};
		}, [
			isDragging,
			state.startTime,
			state.endTime,
			dragOffset,
			dispatch,
			getTimeFromMousePosition,
			snapToInterval,
		]);

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
		}, [getTimeFromMousePosition]);

		const handleTimelineMouseDown = useCallback(
			(e: React.MouseEvent) => {
				const clickTime = getTimeFromMousePosition(e);
				if (clickTime === null) return;

				if (
					state.startTime !== null &&
					state.endTime !== null &&
					clickTime >= state.startTime &&
					clickTime <= state.endTime
				) {
					setDragOffset(clickTime - state.startTime);
					setIsDragging("middle");
				} else {
					dispatch({ type: "SET_START_TIME", payload: clickTime });
					dispatch({
						type: "SET_END_TIME",
						payload: clickTime + SNAP_INTERVAL,
					});
					setIsDragging("new");
				}
			},
			[state.startTime, state.endTime, getTimeFromMousePosition, dispatch],
		);

		const renderTimelineDays = useCallback(() => {
			const days = [];
			for (let i = -1; i < 2; i++) {
				const currentDate = addDays(state.focusedDate, i);
				const dayStart = i * DAY_WIDTH;
				days.push(
					<div
						key={i}
						className="absolute bottom-0 top-0"
						style={{ left: `${dayStart}px`, width: `${DAY_WIDTH}px` }}
					>
						<div className="relative z-10 flex w-full">
							<div className="sticky left-0 px-2 py-1 text-xs text-neutral-200">
								{formatDate(currentDate)}
							</div>
						</div>
						{Array.from({ length: HOURS * 4 + 1 }).map((_, index) => (
							<div
								key={index}
								className={`absolute bottom-0 top-0 w-px ${
									index % 4 === 0 ? "bg-neutral-600" : "bg-neutral-800"
								}`}
								style={{ left: `${index * (HOUR_WIDTH / 4)}px` }}
							/>
						))}
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
		}, [state.focusedDate, formatDate]);

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
						state.startTime !== null && state.endTime !== null
							? state.endTime - state.startTime
							: 0
					}
					onMouseDown={handleTimelineMouseDown}
				>
					{renderTimelineDays()}
					{state.startTime !== null && state.endTime !== null && (
						<TimeRangeSelector
							onMouseEnter={() => setIsTimeRangeSelectorHovered(true)}
							onMouseLeave={() => setIsTimeRangeSelectorHovered(false)}
							startTime={state.startTime}
							endTime={state.endTime}
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
	},
);

export default Timeline;
