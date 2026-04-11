"use client";

import { motion } from "motion/react";
import clsx from "clsx";

export default function SignalChip({
  label,
  value,
  unit = "",
  level,
  delay = 0,
}: {
  label: string;
  value: string | number;
  unit?: string;
  level: "ok" | "warn" | "alert";
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={clsx(
        "rounded-2xl border px-4 py-3 flex flex-col gap-1",
        level === "alert" ? "bg-coral-light border-coral/20 text-coral"
        : level === "warn" ? "bg-amber-light border-amber/20 text-amber"
        : "bg-mint border-mint-dark/30 text-sage"
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-widest opacity-60">{label}</span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-mono font-semibold tabular-nums leading-none">{value}</span>
        {unit && <span className="text-xs opacity-50">{unit}</span>}
      </div>
    </motion.div>
  );
}
