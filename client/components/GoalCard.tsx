"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import clsx from "clsx";
import type { Goal, GoalProgress, GoalStatus } from "@/lib/types";

interface GoalCardProps {
  goal: Goal;
  initialPercentComplete: number;
  initialStatus: GoalStatus;
  delay?: number;
  onArchive?: (id: string) => void;
  /** compact=true hides the card chrome — used inside the hero panel */
  compact?: boolean;
}

const STATUS_CONFIG: Record<GoalStatus, { pill: string; bar: string; icon: string; label: string }> = {
  achieved:    { pill: "bg-sage/15 text-sage",          bar: "bg-sage",      icon: "✓",  label: "achieved"  },
  "on-track":  { pill: "bg-sage/10 text-sage",          bar: "bg-sage/60",   icon: "💪", label: "on track"  },
  "at-risk":   { pill: "bg-amber-100 text-amber-700",   bar: "bg-amber-400", icon: "⚠", label: "at risk"   },
  "off-track": { pill: "bg-coral/15 text-coral",        bar: "bg-coral",     icon: "⚠", label: "off track" },
};

function formatValue(value: number, unit: string): string {
  if (unit === "min" && value >= 60) {
    const h = Math.floor(value / 60);
    const m = Math.round(value % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (unit === "steps" && value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${Math.round(value * 10) / 10} ${unit}`;
}

export default function GoalCard({
  goal,
  initialPercentComplete,
  initialStatus,
  delay = 0,
  onArchive,
  compact = false,
}: GoalCardProps) {
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/goals/${goal.id}/evaluate`)
      .then((r) => r.json())
      .then((d: GoalProgress) => { setProgress(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [goal.id]);

  const status = progress?.status ?? initialStatus;
  const pct = Math.min(progress?.percentComplete ?? initialPercentComplete, 100);
  const config = STATUS_CONFIG[status];

  const inner = (
    <div className={clsx("flex flex-col gap-3", compact ? "" : "p-5")}>
      {/* Header — hidden in compact mode (hero card shows title itself) */}
      {!compact && (
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/40">
              {goal.timeframe === "1d" ? "1-day goal" : "7-day goal"}
              {goal.source === "ai" && <span className="ml-1.5 text-sage">· AI</span>}
            </span>
            <p className="text-sm font-semibold text-ink leading-snug">{goal.title}</p>
          </div>
          <span className={clsx("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap", config.pill)}>
            {config.icon} {config.label}
          </span>
        </div>
      )}

      {/* Status pill — compact mode only */}
      {compact && (
        <span className={clsx("self-start rounded-full px-2.5 py-1 text-[10px] font-semibold", config.pill)}>
          {config.icon} {config.label}
          <span className="ml-1 opacity-60">· {goal.timeframe === "1d" ? "today" : "7-day"}</span>
        </span>
      )}

      {/* Progress — numeric for metric goals, met/not-met for abstract */}
      {goal.goalType === "abstract" ? (
        <div className="flex items-center gap-2 py-0.5">
          {loading ? (
            <div className="h-6 w-24 bg-ink/6 rounded-full animate-pulse" />
          ) : (
            <motion.span
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={clsx(
                "rounded-full px-3 py-1 text-xs font-semibold",
                status === "achieved" ? "bg-sage/15 text-sage" : "bg-coral/15 text-coral"
              )}
            >
              {status === "achieved" ? "✓ Met today" : "✗ Not met"}
            </motion.span>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <div className="h-1.5 w-full rounded-full bg-ink/8 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8, delay: delay + 0.15, ease: [0.22, 1, 0.36, 1] }}
              className={clsx("h-full rounded-full", config.bar)}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] text-ink-soft/50 font-mono">
              {progress ? formatValue(progress.currentValue, goal.unit) : "—"}
              <span className="opacity-60"> / {formatValue(goal.target, goal.unit)}</span>
            </span>
            <span className="text-[10px] font-mono font-medium text-ink-soft/60">{pct}%</span>
          </div>
        </div>
      )}

      {/* Mistral message */}
      <div className="min-h-[2rem]">
        {loading ? (
          <div className="flex flex-col gap-1.5">
            <div className="h-2 bg-ink/6 rounded-full w-full animate-pulse" />
            <div className="h-2 bg-ink/6 rounded-full w-3/4 animate-pulse" />
          </div>
        ) : progress?.message ? (
          <p className="text-xs text-ink-soft leading-relaxed">
            {progress.sentiment === "encouragement" ? "💪 " : "⚠️ "}
            {progress.message}
          </p>
        ) : null}
      </div>

      {/* Archive link */}
      {!compact && onArchive && (
        <div className="flex justify-end pt-1 border-t border-mint-dark/20">
          <button
            onClick={() => onArchive(goal.id)}
            className="text-[10px] text-ink-soft/30 hover:text-coral transition-colors"
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );

  if (compact) return inner;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className="rounded-3xl bg-white/80 border border-mint-dark/30 shadow-sm overflow-hidden"
    >
      {inner}
    </motion.div>
  );
}
