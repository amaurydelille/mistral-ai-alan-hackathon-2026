"use client";

import { motion } from "motion/react";

const SIZE = 96;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ringColor(score: number): string {
  if (score >= 65) return "#5B9E72";
  if (score >= 40) return "#E6A817";
  return "#D86849";
}

function trackColor(score: number): string {
  if (score >= 65) return "#5B9E7226";
  if (score >= 40) return "#E6A81726";
  return "#D8684926";
}

/** Header wellness readout: animated circular ring wrapping the numeric score. */
export default function LiveBadge({ wellnessScore }: { wellnessScore: number }) {
  const pct = Math.min(100, Math.max(0, wellnessScore));
  const fillOffset = CIRCUMFERENCE * (1 - pct / 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="shrink-0 flex flex-col items-center gap-1"
    >
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ transform: "rotate(-90deg)" }}
        >
          {/* Track */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={trackColor(wellnessScore)}
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
          {/* Animated fill */}
          <motion.circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={ringColor(wellnessScore)}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            initial={{ strokeDashoffset: CIRCUMFERENCE }}
            animate={{ strokeDashoffset: fillOffset }}
            transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        {/* Score label centred inside ring */}
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span className="font-mono text-2xl font-bold text-ink tabular-nums">
            {wellnessScore}
          </span>
          <span className="text-[9px] font-medium uppercase tracking-widest text-ink-soft/45 mt-0.5">
            /100
          </span>
        </div>
      </div>
      <span className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/40">
        Wellness
      </span>
    </motion.div>
  );
}
