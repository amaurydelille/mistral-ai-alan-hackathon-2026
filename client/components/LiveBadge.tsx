"use client";

import { motion } from "motion/react";
import clsx from "clsx";

function barTone(score: number) {
  if (score >= 65) {
    return { track: "bg-sage/15", fill: "bg-sage" };
  }
  if (score >= 40) {
    return { track: "bg-amber/15", fill: "bg-amber" };
  }
  return { track: "bg-coral/15", fill: "bg-coral" };
}

/** Header wellness readout: numeric score + bar intensity (replaces legacy “Live · …” tag). */
export default function LiveBadge({ wellnessScore }: { wellnessScore: number }) {
  const pct = Math.min(100, Math.max(0, wellnessScore));
  const tone = barTone(wellnessScore);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="w-full sm:w-[min(100%,18rem)] shrink-0"
    >
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className="font-mono text-3xl sm:text-4xl font-bold text-ink tabular-nums">
            {wellnessScore}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/45 pb-0.5">
            /100
          </span>
        </div>
        <span className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/40 pb-0.5">
          Wellness
        </span>
      </div>
      <div className={clsx("mt-2 h-1.5 w-full rounded-full overflow-hidden", tone.track)}>
        <motion.div
          className={clsx("h-full rounded-full", tone.fill)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </motion.div>
  );
}
