// New TimeRangeSelector component
export default function TimeRangeSelector({
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
