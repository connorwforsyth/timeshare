"use client";

import React, { useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { format, addHours, subHours, setMinutes, setHours } from "date-fns";

const transition = { type: "spring", stiffness: 300, damping: 30 };

export default function TimeSelector() {
	const [currentTime, setCurrentTime] = useState(new Date());
	const [direction, setDirection] = useState(0);

	function nextHour() {
		setCurrentTime((time) => addHours(time, 1));
		setDirection(1);
	}

	function previousHour() {
		setCurrentTime((time) => subHours(time, 1));
		setDirection(-1);
	}

	const timeSlots = [0, 15, 30, 45].map((minutes) => {
		return setMinutes(currentTime, minutes);
	});

	return (
		<MotionConfig transition={transition}>
			<div className="relative overflow-hidden rounded-2xl bg-white p-6">
				<header className="mb-4 flex items-center justify-between">
					<motion.button
						className="rounded-full bg-slate-100 p-2"
						onClick={previousHour}
					>
						<ChevronLeftIcon className="h-4 w-4" />
					</motion.button>
					<AnimatePresence mode="popLayout" initial={false}>
						<motion.div
							key={format(currentTime, "HH")}
							initial={{ y: direction * 20, opacity: 0 }}
							animate={{ y: 0, opacity: 1 }}
							exit={{ y: direction * -20, opacity: 0 }}
							className="font-semibold"
						>
							{format(currentTime, "h aa")}
						</motion.div>
					</AnimatePresence>
					<motion.button
						className="rounded-full bg-slate-100 p-2"
						onClick={nextHour}
					>
						<ChevronRightIcon className="h-4 w-4" />
					</motion.button>
				</header>
				<div className="grid grid-cols-2 gap-2">
					{timeSlots.map((time) => (
						<button
							key={format(time, "HH:mm")}
							className="rounded bg-slate-100 p-2 transition-colors hover:bg-slate-200"
							onClick={() => console.log(format(time, "HH:mm"))}
						>
							{format(time, "HH:mm")}
						</button>
					))}
				</div>
			</div>
		</MotionConfig>
	);
}
