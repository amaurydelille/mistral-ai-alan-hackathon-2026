"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import clsx from "clsx";
import type { Goal, GoalProgress, GoalStatus, GoalMetric } from "@/lib/types";

interface PromiseCardProps {
  goal: Goal;
  initialPercentComplete: number;
  initialStatus: GoalStatus;
  initialValue: number;
  delay?: number;
  onArchive?: (id: string) => void;
  /** hero = full-width large treatment for primary promise */
  hero?: boolean;
}

const STATUS_CFG: Record<
  GoalStatus,
  {
    badge: string;
    badgeBg: string;
    badgeText: string;
    border: string;
    bg: string;
    bar: string;
    strip: string;
    accentText: string;
    icon: string;
  }
> = {
  achieved: {
    badge: "KEPT",
    badgeBg: "bg-sage/15",
    badgeText: "text-sage",
    border: "border-sage/20",
    bg: "bg-gradient-to-br from-sage/5 via-mint/20 to-white/60",
    bar: "bg-sage",
    strip: "bg-sage",
    accentText: "text-sage",
    icon: "✓",
  },
  "on-track": {
    badge: "ON TRACK",
    badgeBg: "bg-sage/10",
    badgeText: "text-sage",
    border: "border-mint-dark/25",
    bg: "bg-white/80",
    bar: "bg-sage/50",
    strip: "bg-sage/40",
    accentText: "text-sage/80",
    icon: "→",
  },
  "at-risk": {
    badge: "AT RISK",
    badgeBg: "bg-amber-100",
    badgeText: "text-amber-700",
    border: "border-amber-200",
    bg: "bg-amber-50/50",
    bar: "bg-amber-400",
    strip: "bg-amber-400",
    accentText: "text-amber-700",
    icon: "!",
  },
  "off-track": {
    badge: "BROKEN",
    badgeBg: "bg-coral/15",
    badgeText: "text-coral",
    border: "border-coral/20",
    bg: "bg-gradient-to-br from-coral/5 via-white/80 to-white/60",
    bar: "bg-coral",
    strip: "bg-coral",
    accentText: "text-coral",
    icon: "✗",
  },
};

function fmtVal(value: number, unit: string): string {
  if (unit === "min" && value >= 60) {
    const h = Math.floor(Math.abs(value) / 60);
    const m = Math.round(Math.abs(value) % 60);
    const prefix = value < 0 ? "-" : "";
    return m > 0 ? `${prefix}${h}h ${m}m` : `${prefix}${h}h`;
  }
  if (unit === "steps" && Math.abs(value) >= 1000)
    return `${(value / 1000).toFixed(1)}k`;
  return `${Math.round(value * 10) / 10}${unit ? " " + unit : ""}`;
}

const VERBS: Partial<Record<GoalMetric, string>> = {
  sleep_duration_min: "slept",
  deep_sleep_min: "got",
  steps: "walked",
  active_min: "were active for",
  resting_hr: "resting HR was",
  sedentary_hours: "were sedentary for",
  avg_stress: "stress was",
};

function buildVerdict(goal: Goal, value: number, status: GoalStatus): string {
  if (goal.goalType === "abstract") {
    return status === "achieved"
      ? "You kept this promise today."
      : "This promise wasn't kept today.";
  }

  const verb = VERBS[goal.metric] ?? "recorded";
  const actual = fmtVal(value, goal.unit);
  const target = fmtVal(goal.target, goal.unit);

  if (status === "achieved") {
    if (goal.comparator === "gte" && value > goal.target) {
      const bonus = value - goal.target;
      return `You ${verb} ${actual} — ${fmtVal(bonus, goal.unit)} over your ${target} promise.`;
    }
    return `You ${verb} ${actual}. Promise kept.`;
  }

  if (status === "off-track" || status === "at-risk") {
    if (goal.comparator === "gte") {
      const short = goal.target - value;
      return `You ${verb} ${actual} instead of ${target}. That's ${fmtVal(short, goal.unit)} short.`;
    } else {
      const over = value - goal.target;
      return `You ${verb} ${actual} — ${fmtVal(over, goal.unit)} over your ${target} limit.`;
    }
  }

  // on-track
  if (goal.comparator === "gte") {
    const left = goal.target - value;
    return left <= 0
      ? `You ${verb} ${actual}. Right on target.`
      : `You ${verb} ${actual} so far — ${fmtVal(left, goal.unit)} to go.`;
  }
  return `${actual} vs ${target} limit.`;
}

export default function PromiseCard({
  goal,
  initialPercentComplete,
  initialStatus,
  initialValue,
  delay = 0,
  onArchive,
  hero = false,
}: PromiseCardProps) {
  const [progress, setProgress] = useState<GoalProgress | null>(null);
  const [evalLoading, setEvalLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/goals/${goal.id}/evaluate`)
      .then((r) => r.json())
      .then((d: GoalProgress) => {
        setProgress(d);
        setEvalLoading(false);
      })
      .catch(() => setEvalLoading(false));
  }, [goal.id]);

  const status = progress?.status ?? initialStatus;
  const value = progress?.currentValue ?? initialValue;
  const pct = Math.min(progress?.percentComplete ?? initialPercentComplete, 100);
  const cfg = STATUS_CFG[status];
  const verdict = buildVerdict(goal, value, status);

  const content = (
    <div className={clsx("flex flex-col", hero ? "gap-4 p-6" : "gap-3 p-5")}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/40">
            {goal.timeframe === "1d" ? "Daily promise" : "7-day promise"}
            {goal.source === "ai" && (
              <span className="ml-1.5 text-sage">· AI</span>
            )}
          </span>
          <p
            className={clsx(
              "font-semibold text-ink leading-snug truncate",
              hero ? "text-xl" : "text-sm"
            )}
          >
            {goal.title}
          </p>
        </div>

        {/* Status badge */}
        <span
          className={clsx(
            "shrink-0 rounded-full px-3 py-1 font-bold tracking-wider uppercase whitespace-nowrap",
            hero ? "text-xs" : "text-[10px]",
            cfg.badgeBg,
            cfg.badgeText
          )}
        >
          {cfg.icon} {cfg.badge}
        </span>
      </div>

      {/* Rationale (hero only) */}
      {hero && goal.rationale && (
        <p className="text-sm text-ink-soft/70 leading-relaxed -mt-1">
          {goal.rationale}
        </p>
      )}

      {/* Verdict */}
      <p className={clsx("font-medium leading-snug", hero ? "text-base" : "text-sm", cfg.accentText)}>
        {verdict}
      </p>

      {/* Progress bar — metric goals */}
      {goal.goalType === "metric" && (
        <div className="flex flex-col gap-1.5">
          <div className="h-1.5 w-full rounded-full bg-ink/8 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{
                duration: 0.9,
                delay: delay + 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={clsx("h-full rounded-full", cfg.bar)}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-[10px] text-ink-soft/50 font-mono">
              {fmtVal(value, goal.unit)}
              <span className="opacity-60"> / {fmtVal(goal.target, goal.unit)}</span>
            </span>
            <span className="text-[10px] font-mono font-medium text-ink-soft/60">
              {pct}%
            </span>
          </div>
        </div>
      )}

      {/* Mistral coaching line */}
      <div className="min-h-[2.5rem]">
        {evalLoading ? (
          <div className="flex flex-col gap-1.5">
            <div className="h-2 bg-ink/6 rounded-full w-full animate-pulse" />
            <div className="h-2 bg-ink/6 rounded-full w-2/3 animate-pulse" />
          </div>
        ) : progress?.message ? (
          <p className="text-xs text-ink-soft/60 leading-relaxed italic">
            &ldquo;{progress.message}&rdquo;
          </p>
        ) : null}
      </div>

      {/* Archive */}
      {onArchive && (
        <div className="flex justify-end pt-1 border-t border-ink/5">
          <button
            onClick={() => onArchive(goal.id)}
            className="text-[10px] text-ink-soft/25 hover:text-coral transition-colors"
          >
            Remove promise
          </button>
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      className={clsx(
        "rounded-3xl border shadow-sm overflow-hidden",
        cfg.border,
        cfg.bg
      )}
    >
      {/* Color accent strip */}
      <div className={clsx("h-[3px]", cfg.strip)} />
      {content}
    </motion.div>
  );
}
