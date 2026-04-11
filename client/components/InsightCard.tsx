"use client";

import { motion } from "motion/react";
import clsx from "clsx";
import type { ForecastInsight } from "@/lib/types";

export default function InsightCard({
  insight,
  delay = 0,
}: {
  insight: ForecastInsight;
  delay?: number;
}) {
  const colors = {
    alert: { border: "border-coral/20", bg: "bg-coral-light", dot: "bg-coral", value: "text-coral" },
    warn:  { border: "border-amber/20", bg: "bg-amber-light", dot: "bg-amber", value: "text-amber" },
    ok:    { border: "border-mint-dark/30", bg: "bg-mint",    dot: "bg-sage",  value: "text-sage"  },
  }[insight.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={clsx("rounded-2xl border px-5 py-4 flex gap-4", colors.bg, colors.border)}
    >
      <div className={clsx("w-2 h-2 rounded-full mt-1.5 shrink-0", colors.dot)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <p className="text-sm font-semibold text-ink">{insight.title}</p>
          <span className={clsx("text-xs font-mono font-semibold shrink-0", colors.value)}>
            {insight.value}
          </span>
        </div>
        <p className="text-xs text-ink leading-relaxed">{insight.description}</p>
      </div>
    </motion.div>
  );
}
