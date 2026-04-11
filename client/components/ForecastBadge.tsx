"use client";

import { motion } from "motion/react";
import clsx from "clsx";
import type { RiskLevel } from "@/lib/types";

interface ForecastBadgeProps {
  label: string;
  date: string;
  risk: RiskLevel;
  reason: string;
  delay?: number;
}

const RISK_CONFIG = {
  low: {
    dot: "🟢",
    bg: "bg-mint",
    border: "border-mint-dark/40",
    text: "text-sage-dark",
    badge: "bg-sage/10 text-sage",
    label: "Low risk",
  },
  moderate: {
    dot: "🟡",
    bg: "bg-amber-light",
    border: "border-amber/30",
    text: "text-amber",
    badge: "bg-amber/10 text-amber",
    label: "Moderate risk",
  },
  high: {
    dot: "🔴",
    bg: "bg-coral-light",
    border: "border-coral/30",
    text: "text-coral",
    badge: "bg-coral/10 text-coral",
    label: "High risk",
  },
};

export default function ForecastBadge({
  label,
  date,
  risk,
  reason,
  delay = 0,
}: ForecastBadgeProps) {
  const cfg = RISK_CONFIG[risk];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      className={clsx(
        "rounded-3xl border p-6 flex flex-col gap-4",
        cfg.bg,
        cfg.border
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-ink-soft/60">
            {label}
          </p>
          <p className="text-sm text-ink-soft">{date}</p>
        </div>
        {risk === "high" ? (
          <motion.span
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="text-3xl"
          >
            {cfg.dot}
          </motion.span>
        ) : (
          <span className="text-3xl">{cfg.dot}</span>
        )}
      </div>

      {/* Risk badge */}
      <span
        className={clsx(
          "self-start rounded-full px-3 py-1 text-xs font-semibold",
          cfg.badge
        )}
      >
        {cfg.label}
      </span>

      {/* Reason */}
      <p className="text-sm text-ink leading-relaxed">{reason}</p>
    </motion.div>
  );
}
