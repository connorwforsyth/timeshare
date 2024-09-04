"use client";
import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";
import {
	addHours,
	isSameDay,
	format,
	isSameHour,
	parse,
	subHours,
	eachDayOfInterval,
	startOfMonth,
	startOfWeek,
	endOfWeek,
	endOfMonth,
	isSameMonth,
	eachMinuteOfInterval,
	startOfHour,
	startOfDay,
	endOfHour,
	formatRelative,
	isEqual,
	endOfDay,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { start } from "repl";

const transition = { type: "spring", stiffness: 300, damping: 30 };
const hourInterval = 8;
const stepChange = 1;

export default function ShareTime() {
	const [currentTime, setCurrentTime] = useState(new Date());
	const [direction, setDirection] = useState(0);
	const [isAnimating, setIsAnimating] = useState(false);
	const day = currentTime;

	function next() {
		setCurrentTime((time) => addHours(time, stepChange));
		setDirection(1);
	}
	function previous() {
		setCurrentTime((time) => subHours(time, stepChange));
		setDirection(-1);
	}

	let mins = useMemo(() => {
		const start = startOfHour(currentTime);
		const end = addHours(start, hourInterval + 1);
		return eachMinuteOfInterval({ start, end }).filter((time) =>
			[0, 15, 30, 45].includes(time.getMinutes()),
		);
	}, [currentTime]);

	return (
		<div className="flex flex-col gap-4">
			<AnimatePresence
				mode="popLayout"
				custom={direction}
				initial={false}
				onExitComplete={() => setIsAnimating(false)}
			>
				<div className="flex items-center justify-between">
					<p>{format(day, "EEE d MMM yyyy, h a")}</p>
					<div className="flex">
						<motion.button
							className="relative z-10 flex rounded-full bg-slate-300 p-2"
							onClick={previous}
						>
							<ChevronLeftIcon className="h-4 w-4" />
						</motion.button>
						<motion.button
							className="relative z-10 flex rounded-full bg-slate-300 p-2"
							onClick={next}
						>
							<ChevronRightIcon className="h-4 w-4" />
						</motion.button>
					</div>
				</div>
				<motion.div
					key={currentTime.getTime()}
					variants={variants}
					custom={direction}
					initial="enter"
					animate="middle"
					exit="exit"
				>
					<div className="flex h-36 justify-between overflow-hidden rounded-lg border bg-neutral-900">
						{mins.map((mins, idx) => (
							<MinsBar
								key={format(mins, "yyyy-MM-dd HH:mm:ss")}
								index={idx}
								mins={mins}
							/>
						))}
					</div>
				</motion.div>
			</AnimatePresence>
		</div>
	);
}

let variants = {
	enter: (direction: number) => {
		return { x: `${100 * direction}px`, opacity: 0 };
	},
	middle: { x: "0px", opacity: 1 },
	exit: (direction: number) => {
		return { x: `${-100 * direction}px`, opacity: 0 };
	},
};

type MinsBarProps = {
	mins: Date;
	index: number;
};

function MinsBar({ mins, index }: MinsBarProps) {
	return (
		<div
			className={`justify-left relative h-full w-[1px] rounded-full text-xs ${isSameDay(mins, new Date()) ? "text-white" : "text-neutral-400"} ${isEqual(mins, startOfHour(mins)) ? "bg-white" : "bg-neutral-700"}`}
		>
			<div className="relative z-10 flex w-auto flex-col gap-4 p-1 *:h-2">
				{/* Would love to do some conditional formatting in here. I.e. after 7 days, reformat it. */}
				<p className="text-nowrap capitalize">
					{index === 0 || isEqual(mins, startOfDay(mins))
						? formatRelative(mins, new Date()).split(" at ")[0]
						: ""}
				</p>
				<p className="text-nowrap">
					{isEqual(mins, startOfHour(mins)) ? format(mins, "h a") : ""}
				</p>
			</div>
		</div>
	);
}
