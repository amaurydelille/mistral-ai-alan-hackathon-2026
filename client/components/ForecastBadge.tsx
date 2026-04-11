"use client";

import { motion } from "motion/react";
import clsx from "clsx";
import type { RiskLevel } from "@/lib/types";

interface ForecastBadgeProps {
  label: string;
  date: string;
  risk: RiskLevel;
  reason: string;
  composite?: number;
  delay?: number;
}

const RISK_CONFIG = {
  low: {
    bg: "bg-mint",
    border: "border-mint-dark/40",
    scoreColor: "text-sage",
    barColor: "bg-sage",
    barTrack: "bg-sage/15",
    pill: "bg-sage/10 text-sage border-sage/20",
    dot: "bg-sage",
    label: "Low risk",
    icon: "↓",
  },
  moderate: {
    bg: "bg-amber-light",
    border: "border-amber/30",
    scoreColor: "text-amber",
    barColor: "bg-amber",
    barTrack: "bg-amber/15",
    pill: "bg-amber/10 text-amber border-amber/20",
    dot: "bg-amber",
    label: "Moderate",
    icon: "→",
  },
  high: {
    bg: "bg-coral-light",
    border: "border-coral/30",
    scoreColor: "text-coral",
    barColor: "bg-coral",
    barTrack: "bg-coral/15",
    pill: "bg-coral/10 text-coral border-coral/20",
    dot: "bg-coral",
    label: "High risk",
    icon: "↑",
  },
};

function formatDate(iso: string): string {
  const d = new Date(iso + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function ForecastBadge({
  label,
  date,
  risk,
  reason,
  composite,
  delay = 0,
}: ForecastBadgeProps) {
  const cfg = RISK_CONFIG[risk];
  // Flip to wellness score: 100 = perfect health, 0 = critical.
  // High number feels rewarding; low number signals action needed.
  const wellnessScore = composite !== undefined ? 100 - composite : undefined;
  const pct = wellnessScore !== undefined ? Math.min(100, Math.max(0, wellnessScore)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      className={clsx(
        "rounded-2xl border p-3.5 sm:p-4 flex flex-col gap-2.5",
        cfg.bg,
        cfg.border
      )}
    >
      {/* ── Row 1: day label + risk pill ─────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-ink">
            {label}
          </p>
          <p className="text-[11px] text-ink-soft/60 mt-0.5">{formatDate(date)}</p>
        </div>

        <span className={clsx(
          "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap",
          cfg.pill
        )}>
          {risk === "high" ? (
            <motion.span
              className={clsx("w-1.5 h-1.5 rounded-full", cfg.dot)}
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
          ) : (
            <span className={clsx("w-1.5 h-1.5 rounded-full", cfg.dot)} />
          )}
          {cfg.label}
        </span>
      </div>

      {/* ── Row 2: wellness score (higher = better) ──────── */}
      {wellnessScore !== undefined && (
        <div className="flex flex-col gap-0.5">
          <div className="flex items-end gap-1 leading-none">
            <span className={clsx("font-mono font-bold tabular-nums", cfg.scoreColor, "text-2xl sm:text-3xl")}>
              {wellnessScore}
            </span>
            <span className="text-[10px] text-ink-soft/50 mb-0.5 font-mono">/100</span>
          </div>
          <p className="text-[9px] uppercase tracking-widest text-ink-soft/40 font-medium">wellness score</p>
        </div>
      )}

      {/* ── Row 3: progress bar ───────────────────────────── */}
      {composite !== undefined && (
        <div className={clsx("h-1 rounded-full overflow-hidden", cfg.barTrack)}>
          <motion.div
            className={clsx("h-full rounded-full", cfg.barColor)}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, delay: delay + 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      )}

      {/* ── Row 4: reason ────────────────────────────────── */}
      <p className="text-xs text-ink leading-snug">{reason}</p>
    </motion.div>
  );
}
