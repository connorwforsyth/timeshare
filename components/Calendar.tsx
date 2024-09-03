"use client";
import {
	addMonths,
	subMonths,
	parse,
	format,
	eachDayOfInterval,
	startOfMonth,
	endOfMonth,
	startOfWeek,
	endOfWeek,
	isSameMonth,
} from "date-fns";
import React, { ReactNode, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence, MotionConfig, Variants } from "framer-motion";
import useMeasure from "react-use-measure";

let transition = { type: "bounce", ease: "circOut", duration: 0.33 };

export default function Calendar() {
	const [monthString, setMonthString] = useState(format(new Date(), "yyyy-MM"));
	const [direction, setDirection] = useState(0);
	const [isAnimating, setIsAnimating] = useState(false);

	let month = parse(monthString, "yyyy-MM", new Date());

	function nextMonth() {
		if (isAnimating) return;
		let next = addMonths(month, 1);
		setMonthString(format(next, "yyyy-MM"));
		setDirection(1);
		setIsAnimating(true);
	}
	function previousMonth() {
		if (isAnimating) return;
		let previous = subMonths(month, 1);
		setMonthString(format(previous, "yyyy-MM"));
		setDirection(-1);
		setIsAnimating(true);
	}

	let days = eachDayOfInterval({
		start: startOfWeek(startOfMonth(month)),
		end: endOfWeek(endOfMonth(month)),
	});

	return (
		<MotionConfig transition={transition}>
			<div className="relative justify-center overflow-hidden rounded-2xl bg-white py-6">
				<ResizablePanel>
					<AnimatePresence
						mode="popLayout"
						custom={direction}
						initial={false}
						onExitComplete={() => setIsAnimating(false)}
					>
						<motion.div
							key={monthString}
							initial="enter"
							animate="middle"
							exit="exit"
						>
							<header className="relative flex justify-between overflow-hidden px-8">
								<motion.button
									variants={removeImmediately}
									className="relative z-10 flex rounded-full bg-slate-300 p-2"
									onClick={previousMonth}
								>
									<ChevronLeftIcon className="h-4 w-4" />
								</motion.button>
								<motion.time
									custom={direction}
									className="w-full text-center"
									variants={variants}
								>
									{format(month, "MMMM yyyy")}
								</motion.time>
								<motion.button
									variants={removeImmediately}
									className="relative z-10 flex rounded-full bg-slate-300 p-2"
									onClick={nextMonth}
								>
									<ChevronRightIcon className="h-4 w-4" />
								</motion.button>
								<div
									className="absolute inset-0"
									style={{
										backgroundImage:
											"linear-gradient(to right, white 10%, transparent 30%, transparent 70%, white 90%)",
									}}
								/>
							</header>
							<motion.div
								variants={removeImmediately}
								className="mt-6 grid grid-cols-7 gap-8 px-8 font-medium text-stone-500"
							>
								<span className="">Su</span>
								<span>Mo</span>
								<span>Tu</span>
								<span>We</span>
								<span>Th</span>
								<span>Fi</span>
								<span>Sa</span>
							</motion.div>
							<motion.div
								custom={direction}
								variants={variants}
								className="mt-6 grid grid-cols-7 gap-8 px-8"
							>
								{days.map((day) => (
									<button
										className={`${isSameMonth(day, month) ? "" : "text-stone-400"} flex h-8 w-8 items-center justify-center rounded-full font-semibold`}
										key={format(day, "yyyy-MM-dd")}
									>
										{format(day, "d")}
									</button>
								))}
							</motion.div>
						</motion.div>
					</AnimatePresence>
				</ResizablePanel>
			</div>
		</MotionConfig>
	);
}

type ResizablePanelProps = {
	children: ReactNode;
};

function ResizablePanel({ children }: ResizablePanelProps) {
	const [ref, bounds] = useMeasure();
	return (
		<motion.div animate={{ height: bounds.height || "auto" }}>
			<div ref={ref}>{children}</div>
		</motion.div>
	);
}

let variants = {
	enter: (direction: number) => {
		return { x: `${100 * direction}%`, opacity: 0 };
	},
	middle: { x: "0%", opacity: 1 },
	exit: (direction: number) => {
		return { x: `${-100 * direction}%`, opacity: 0 };
	},
};

let removeImmediately: Variants = {
	exit: { visibility: "hidden", transition: { duration: 0 } },
};
