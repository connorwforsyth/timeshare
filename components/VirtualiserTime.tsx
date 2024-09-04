"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
	format,
	addHours,
	startOfHour,
	eachHourOfInterval,
	formatRelative,
	startOfDay,
	isEqual,
} from "date-fns";
import { useVirtualizer } from "@tanstack/react-virtual";

export default function LinearTimeline() {
	const [currentTime, setCurrentTime] = useState(new Date());
	// Reference to the scroll container
	const scrollRef = useRef<HTMLDivElement>(null);

	// State to keep track of the hours to be displayed
	const [hours, setHours] = useState<Date[]>([]);

	// Function to load more hours before or after the current hours
	const loadMoreHours = useCallback((direction: "before" | "after") => {
		setHours((prevHours) => {
			const newHours = [...prevHours];
			const baseDate =
				direction === "before" ? newHours[0] : newHours[newHours.length - 1];
			const interval = eachHourOfInterval({
				start:
					direction === "before"
						? addHours(baseDate, -24)
						: addHours(baseDate, 1),
				end:
					direction === "before"
						? addHours(baseDate, -1)
						: addHours(baseDate, 24),
			});
			return direction === "before"
				? [...interval, ...newHours]
				: [...newHours, ...interval];
		});
	}, []);

	// Effect to initialize the hours state with a range of hours around the current time
	useEffect(() => {
		const initialHours = eachHourOfInterval({
			start: addHours(startOfHour(currentTime), -12),
			end: addHours(startOfHour(currentTime), 12),
		});
		setHours(initialHours);
	}, [currentTime]);

	// Virtualizer to handle the virtual scrolling of the hours
	const virtualizer = useVirtualizer({
		count: hours.length, // Total number of items to be virtualized
		getScrollElement: () => scrollRef.current, // Function to get the scroll container element
		estimateSize: () => 100, // Estimated size of each item in pixels
		horizontal: true, // Set to true for horizontal scrolling
		overscan: 5, // Number of items to render outside the visible area for smoother scrolling
	});

	// Effect to set up an IntersectionObserver to load more hours when the start or end sentinel is intersected
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						if (entry.target.id === "start-sentinel") {
							loadMoreHours("before");
						} else if (entry.target.id === "end-sentinel") {
							loadMoreHours("after");
						}
					}
				});
			},
			{ root: scrollRef.current, threshold: 0.1 },
		);

		const startSentinel = document.getElementById("start-sentinel");
		const endSentinel = document.getElementById("end-sentinel");
		if (startSentinel) observer.observe(startSentinel);
		if (endSentinel) observer.observe(endSentinel);

		return () => observer.disconnect();
	}, [loadMoreHours]);

	return (
		<div className="h-36 w-full rounded-lg bg-neutral-900 text-neutral-500">
			<div
				ref={scrollRef}
				className="scroll h-full w-full snap-x snap-proximity overflow-x-hidden overflow-y-visible transition-opacity hover:overflow-x-auto"
				style={{
					scrollbarGutter: "stable",
					scrollbarWidth: "thin",
					scrollbarColor: "#505050",
				}}
			>
				<div
					className="relative h-full"
					style={{ width: `${virtualizer.getTotalSize()}px` }} // Set the width of the container based on the total size calculated by the virtualizer
				>
					{/* Sentinel to detect when the user scrolls to the start */}
					<div id="start-sentinel" className="absolute left-0 h-full w-px" />
					{/* Render the virtualized items */}
					{virtualizer.getVirtualItems().map((virtualItem, idx) => (
						<div
							key={virtualItem.key}
							className="absolute top-0 flex h-full flex-col items-center justify-between"
							style={{
								left: `${virtualItem.start}px`, // Position the item based on its start position calculated by the virtualizer
								width: `${virtualItem.size}px`, // Set the width of the item based on its size calculated by the virtualizer
							}}
						>
							<TimeBar index={idx} date={hours[virtualItem.index]} />
						</div>
					))}
					{/* Sentinel to detect when the user scrolls to the end */}
					<div id="end-sentinel" className="absolute right-0 h-full w-px" />
				</div>
			</div>
		</div>
	);
}

type TimeBarProps = {
	date: Date;
	index: number;
};

// Component to render a single time bar
function TimeBar({ date, index }: TimeBarProps) {
	return (
		<div
			className={`flex h-36 w-full snap-start flex-col border-l-[0.5px] border-dashed pt-1 *:h-4 *:text-xs *:uppercase`}
		>
			<span className="select-none">
				{index === 0 || isEqual(date, startOfDay(date))
					? formatRelative(date, new Date()).split(" at ")[0]
					: ""}
			</span>
			<span className="select-none">{format(date, "h a")}</span>
		</div>
	);
}
