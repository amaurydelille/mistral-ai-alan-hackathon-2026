"use client";

import { motion } from "motion/react";
import clsx from "clsx";
import TrendSparkline from "./TrendSparkline";

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  trend?: number[];
  trendColor?: string;
  trendFill?: string;
  note?: string;
  size?: "hero" | "normal";
  className?: string;
  delay?: number;
}

export default function MetricCard({
  label,
  value,
  unit,
  trend,
  trendColor,
  trendFill,
  note,
  size = "normal",
  className,
  delay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={clsx(
        "rounded-3xl bg-white/80 border border-mint-dark/30 shadow-sm p-6",
        "flex flex-col justify-between gap-3",
        className
      )}
    >
      {/* Top: label + value */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-widest text-ink-soft/60">
          {label}
        </span>
        <div className="flex items-end gap-1">
          <span
            className={clsx(
              "font-mono font-semibold leading-none tabular-nums",
              size === "hero" ? "text-6xl" : "text-3xl"
            )}
          >
            {value}
          </span>
          {unit && (
            <span className="text-base text-ink-soft mb-1 font-body">{unit}</span>
          )}
        </div>
      </div>

      {/* Bottom: sparkline + note */}
      {(trend || note) && (
        <div className="flex flex-col gap-2">
          {trend && (
            <TrendSparkline
              data={trend}
              height={size === "hero" ? 56 : 44}
              color={trendColor}
              fillColor={trendFill}
            />
          )}
          {note && (
            <p className="text-xs text-ink-soft/70 leading-relaxed">{note}</p>
          )}
        </div>
      )}
    </motion.div>
  );
}
