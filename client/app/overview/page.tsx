"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";
import PageShell from "@/components/PageShell";
import MetricCard from "@/components/MetricCard";
import ForecastBadge from "@/components/ForecastBadge";
import ForecastChart from "@/components/ForecastChart";
import InsightCard from "@/components/InsightCard";
import LiveBadge from "@/components/LiveBadge";
import CoachMessage from "@/components/CoachMessage";
import NewGoalDrawer from "@/components/NewGoalDrawer";
import Link from "next/link";
import type {
  DayData,
  Trends,
  UserProfile,
  DailyBriefingResponse,
  ForecastResponse,
  RiskLevel,
  GoalWithProgress,
  GoalStatus,
  GoalMetric,
  Goal,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// Response shape (mirrors app/api/overview/route.ts)
// ---------------------------------------------------------------------------

interface OverviewResponse {
  date: string;
  profile: UserProfile;
  today: DayData;
  last14Days: DayData[];
  trends7d: Trends;
  alert: { headline: string; risk: RiskLevel; composite: number };
  briefing: DailyBriefingResponse;
  forecast: ForecastResponse;
  wellnessTrend: number[];
  strokeRisk?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function Skel({ className }: { className?: string }) {
  return (
    <motion.div
      className={clsx("rounded-2xl bg-ink/5", className)}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function SectionHeading({
  eyebrow,
  title,
  id,
  className,
}: {
  eyebrow: string;
  title: string;
  id?: string;
  className?: string;
}) {
  return (
    <div className={clsx("mb-1", className)}>
      <p className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/50 mb-1">
        {eyebrow}
      </p>
      <h2 id={id} className="font-display text-xl font-semibold text-ink tracking-tight">
        {title}
        <span className="text-sage">.</span>
      </h2>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
      <Skel className="h-6 w-48" />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8">
        <Skel className="h-52 xl:col-span-7 rounded-3xl" />
        <div className="xl:col-span-5 grid grid-cols-2 gap-3">
          <Skel className="h-36 rounded-3xl" />
          <Skel className="h-36 rounded-3xl" />
          <Skel className="h-36 rounded-3xl" />
        </div>
      </div>
      <div>
        <Skel className="h-5 w-40 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skel className="h-48 rounded-3xl" />
          <Skel className="h-48 rounded-3xl" />
          <Skel className="h-48 rounded-3xl" />
        </div>
      </div>
      <Skel className="h-64 w-full rounded-3xl" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Promise verdict helpers (compact, no Mistral needed)
// ---------------------------------------------------------------------------

const PROMISE_VERBS: Partial<Record<GoalMetric, string>> = {
  sleep_duration_min: "slept",
  deep_sleep_min: "got",
  steps: "walked",
  active_min: "active for",
  resting_hr: "HR was",
  sedentary_hours: "sedentary for",
  avg_stress: "stress",
};

function fmtPromiseVal(value: number, unit: string): string {
  if (unit === "min" && value >= 60) {
    const h = Math.floor(Math.abs(value) / 60);
    const m = Math.round(Math.abs(value) % 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (unit === "steps" && Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return `${Math.round(value * 10) / 10}${unit ? " " + unit : ""}`;
}

function promiseVerdict(goal: Goal, value: number, status: GoalStatus): string {
  if (goal.goalType === "abstract") {
    return status === "achieved" ? "Kept today." : "Not kept today.";
  }
  const verb = PROMISE_VERBS[goal.metric] ?? "recorded";
  const actual = fmtPromiseVal(value, goal.unit);
  const target = fmtPromiseVal(goal.target, goal.unit);
  if (status === "achieved") {
    if (goal.comparator === "gte" && value > goal.target) {
      return `You ${verb} ${actual} — ${fmtPromiseVal(value - goal.target, goal.unit)} over ${target}.`;
    }
    return `You ${verb} ${actual}.`;
  }
  if (goal.comparator === "gte") {
    return `You ${verb} ${actual} instead of ${target}.`;
  }
  return `You ${verb} ${actual} — over your ${target} limit.`;
}

const PROMISE_STATUS_STYLE: Record<GoalStatus, { badge: string; dot: string; text: string }> = {
  achieved:   { badge: "bg-sage/15 text-sage",        dot: "bg-sage",      text: "text-sage" },
  "on-track": { badge: "bg-sage/10 text-sage",         dot: "bg-sage/50",   text: "text-ink-soft" },
  "at-risk":  { badge: "bg-amber-100 text-amber-700",  dot: "bg-amber-400", text: "text-amber-700" },
  "off-track":{ badge: "bg-coral/15 text-coral",       dot: "bg-coral",     text: "text-coral" },
};

const PROMISE_BADGE_LABEL: Record<GoalStatus, string> = {
  achieved:   "KEPT",
  "on-track": "ON TRACK",
  "at-risk":  "AT RISK",
  "off-track":"BROKEN",
};

export default function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [promises, setPromises] = useState<GoalWithProgress[]>([]);
  // Evaluated statuses from /api/goals/{id}/evaluate for the overview widget
  const [promiseEvalStatuses, setPromiseEvalStatuses] = useState<Record<string, GoalStatus>>({});
  const [promiseDrawerOpen, setPromiseDrawerOpen] = useState(false);
  const [promisePrefill, setPromisePrefill] = useState<{ title: string; description: string } | undefined>();

  useEffect(() => {
    fetch("/api/goals")
      .then((r) => r.json())
      .then((d: GoalWithProgress[]) => {
        if (!Array.isArray(d)) return;
        setPromises(d);
        // Fetch all evaluations in parallel — needed for abstract goals which
        // always start as "on-track" in the basic list but may be "off-track" after Mistral
        Promise.allSettled(
          d.map((g) =>
            fetch(`/api/goals/${g.goal.id}/evaluate`)
              .then((r) => r.json())
              .then((ev: { status?: GoalStatus }) => {
                if (ev.status) {
                  setPromiseEvalStatuses((prev) => ({ ...prev, [g.goal.id]: ev.status! }));
                }
              })
          )
        );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/overview")
      .then((r) => r.json())
      .then((json: OverviewResponse & { error?: string }) => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Fetch failed"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageShell><OverviewSkeleton /></PageShell>;
  if (error || !data) {
    return (
      <PageShell>
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-ink-soft text-sm">{error ?? "No data available."}</p>
        </div>
      </PageShell>
    );
  }

  const { profile, today, last14Days, trends7d, alert, briefing, forecast, strokeRisk = 0 } = data;
  const { forecast: forecastDays, rescuePlan, computed } = forecast;
  const { currentScores, sleepDebtMin, historicalComposites, historicalDates, dataSource, insights = [] } = computed;

  // ── Derived series for sparklines ──
  const sleepTrend = last14Days.map((d) => d.sleep.durationMin / 60);
  const rhrTrend = last14Days.map((d) => d.heart.restingHr);
  const activeCalTrend = last14Days.map((d) => d.activity.activeCal ?? d.activity.activeMin * 4);

  const sleepHours = (today.sleep.durationMin / 60).toFixed(1);
  const deepPct =
    today.sleep.durationMin > 0
      ? Math.round((today.sleep.deepMin / today.sleep.durationMin) * 100)
      : 0;
  const wellnessNow = 100 - alert.composite;

  const sleepDebtH = Math.floor(sleepDebtMin / 60);
  const sleepDebtM = sleepDebtMin % 60;

  const highestRisk = forecastDays.reduce((a, b) => {
    const order = { low: 0, moderate: 1, high: 2 };
    return order[b.risk] > order[a.risk] ? b : a;
  });

  const projectedComposites = forecastDays.map((d) => 100 - (d.composite ?? 50));
  const wellnessHistorical = historicalComposites.map((c) => 100 - c);

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-ink-soft/50 mb-2">
              {formatFullDate(today.date)}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-semibold text-ink leading-tight">
              Good morning, {profile.name.split(" ")[0]}<span className="text-sage">.</span>
            </h1>
          </div>
          <LiveBadge wellnessScore={wellnessNow} />
        </motion.div>

        {/* Today: briefing + metrics (side by side on xl) */}
        <section aria-labelledby="overview-today-heading" className="space-y-4">
          <SectionHeading eyebrow="Today" title="Snapshot & vitals" id="overview-today-heading" />
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 xl:items-start">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="xl:col-span-7 rounded-2xl bg-mint/35 border border-mint-dark/25 p-4 sm:p-5 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage text-[10px] font-semibold font-display text-cream"
                  aria-hidden
                >
                  V
                </div>
                <p className="text-[10px] font-medium uppercase tracking-widest text-sage">
                  Coach read · patterns and next step
                </p>
              </div>
              <CoachMessage
                text={briefing.narrative}
                from="coach"
                variant="plain"
                typewriter={false}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <div className="rounded-xl bg-white/65 border border-mint-dark/20 px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/50 mb-1">
                    Notable vs your usual
                  </p>
                  <p className="text-sm text-ink leading-snug">{briefing.topInsight}</p>
                </div>
                <div className="rounded-xl bg-white/65 border border-mint-dark/20 px-3 py-2.5">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/50 mb-1">
                    One thing to try
                  </p>
                  <p className="text-sm text-ink leading-snug">{briefing.actionTip}</p>
                </div>
              </div>
            </motion.div>

            <div className="xl:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <MetricCard
                label="Sleep last night"
                value={sleepHours}
                unit="h"
                trend={sleepTrend}
                trendColor="#D86849"
                trendFill="#FCEEE9"
                note={
                  today.sleep.deepMin > 0
                    ? `${today.sleep.deepMin}min deep (${deepPct}%) · eff. ${Math.round(today.sleep.efficiency * 100)}%`
                    : `eff. ${Math.round(today.sleep.efficiency * 100)}% · ${today.sleep.wakeUps} wake-ups`
                }
                delay={0.2}
              />
              <MetricCard
                label="Resting heart rate"
                value={String(today.heart.restingHr)}
                unit="bpm"
                trend={rhrTrend}
                trendColor="#D86849"
                trendFill="#FCEEE9"
                note={`${profile.baselineRhr}bpm baseline · ${trends7d.avgRhr}bpm 7d avg`}
                delay={0.25}
              />
              <MetricCard
                label="Active calories"
                value={String(today.activity.activeCal ?? today.activity.activeMin * 4)}
                unit="kcal"
                trend={activeCalTrend}
                trendColor="#5B9E72"
                trendFill="#EAF5EE"
                note={[
                  today.activity.hrZoneModerateMin != null && today.activity.hrZoneModerateMin > 0
                    ? `${today.activity.hrZoneModerateMin}min moderate`
                    : null,
                  today.activity.hrZoneLightMin != null && today.activity.hrZoneLightMin > 0
                    ? `${today.activity.hrZoneLightMin}min light`
                    : null,
                  today.activity.burnedCalories != null && today.activity.burnedCalories > 0
                    ? `${today.activity.burnedCalories} kcal total`
                    : null,
                ].filter(Boolean).join(" · ") || `${today.activity.steps.toLocaleString()} steps`}
                delay={0.35}
              />
              <MetricCard
                label="Sleep debt (7d)"
                value={`${sleepDebtH}h ${String(sleepDebtM).padStart(2, "0")}m`}
                unit=""
                note={sleepDebtMin > 300 ? "High — prioritise recovery" : sleepDebtMin > 120 ? "Moderate accumulation" : "Within healthy range"}
                delay={0.4}
              />
            </div>
          </div>
        </section>

        {/* Outlook: rescue first, then 3-day forecast */}
        <section aria-labelledby="overview-outlook-heading" className="space-y-4">
          <SectionHeading eyebrow="Predictive health" title="Next 3 days" id="overview-outlook-heading" />

          {rescuePlan.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="rounded-2xl bg-white/80 border border-mint-dark/30 shadow-sm p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-sage shrink-0" />
                <h3 className="text-xs font-medium uppercase tracking-widest text-sage">
                  {highestRisk.label} rescue plan
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-x-6 md:gap-y-3">
                {rescuePlan.map((item, i) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.45 + i * 0.07, duration: 0.3 }}
                    className="flex gap-3"
                  >
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-mint flex items-center justify-center text-[11px] font-bold text-sage font-mono mt-0.5">
                      {item.step}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink mb-0.5">{item.action}</p>
                      <p className="text-xs text-ink-soft leading-relaxed">{item.why}</p>
                      <button
                        onClick={() => {
                          setPromisePrefill({ title: item.action, description: item.why });
                          setPromiseDrawerOpen(true);
                        }}
                        className="mt-1.5 text-[11px] cursor-pointer hover:underline font-medium text-sage hover:text-sage-dark transition-colors"
                      >
                        + Make a promise →
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {forecastDays.map((day, i) => (
              <ForecastBadge
                key={day.date + day.label}
                label={day.label}
                date={day.date}
                risk={day.risk}
                reason={day.reason}
                composite={day.composite}
                delay={0.5 + i * 0.08}
              />
            ))}
          </div>
        </section>

        {/* Context: insights + chart */}
        <section aria-labelledby="overview-context-heading" className="space-y-6">
          <SectionHeading eyebrow="Signals & history" title="Context" id="overview-context-heading" />

{(insights.length > 0 || strokeRisk > 10) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85 }}>
              <p className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/40 mb-3">
                What your body is telling you
              </p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {insights.map((ins, i) => (
                  <InsightCard key={ins.id} insight={ins} delay={0.9 + i * 0.06} />
                ))}
                {strokeRisk > 10 && (
                  <InsightCard
                    delay={0.9 + insights.length * 0.06}
                    insight={{
                      id: "stroke-risk",
                      level: strokeRisk >= 40 ? "alert" : "warn",
                      title: "Cardiovascular load",
                      value: `${strokeRisk}/100`,
                      description:
                        strokeRisk >= 40
                          ? `Your resting HR has been ${trends7d.avgRhr - (profile.baselineRhr || 56)}bpm above baseline for 7 days and sleep debt is accumulating — this combination raises vascular strain. Prioritise recovery sleep and reduce caffeine today.`
                          : `Resting HR is trending ${trends7d.avgRhr - (profile.baselineRhr || 56)}bpm above your baseline. Sleep debt compounds this — a full night's sleep tonight will start to reverse it.`,
                    }}
                  />
                )}
              </div>
            </motion.div>
          )}

          {promises.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.95, duration: 0.4 }}
            >
              <div className="flex items-baseline justify-between mb-3">
                <p className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/40">
                  Your promises
                </p>
                <Link
                  href="/promises"
                  className="text-xs font-medium text-sage hover:text-sage-dark transition-colors"
                >
                  See all →
                </Link>
              </div>

              <div className="rounded-3xl bg-white/80 border border-mint-dark/30 shadow-sm overflow-hidden">
                {promises.map(({ goal, progress }, i) => {
                  // Use Mistral-evaluated status when available (abstract goals start as "on-track")
                  const status = promiseEvalStatuses[goal.id] ?? progress.status;
                  const cfg = PROMISE_STATUS_STYLE[status];
                  const verdict = promiseVerdict(goal, progress.currentValue, status);
                  const isLast = i === promises.length - 1;
                  return (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + i * 0.06, duration: 0.3 }}
                      className={clsx(
                        "flex items-center gap-4 px-5 py-4",
                        !isLast && "border-b border-mint-dark/20"
                      )}
                    >
                      <div className={clsx("w-2 h-2 rounded-full shrink-0", cfg.dot)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-ink leading-none mb-0.5 truncate">
                          {goal.title}
                        </p>
                        <p className={clsx("text-xs leading-snug", cfg.text)}>
                          {verdict}
                        </p>
                      </div>
                      <span className={clsx(
                        "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase",
                        cfg.badge
                      )}>
                        {PROMISE_BADGE_LABEL[status]}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {historicalComposites.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.4 }}
                className="rounded-3xl bg-white/80 border border-mint-dark/30 shadow-sm p-5 sm:p-6 overflow-x-auto"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-widest text-ink-soft/50">
                      Wellness score over time
                    </p>
                    <p className="text-xs text-ink-soft/40 mt-0.5 max-w-md">
                      Solid = history (EWMA) · Dashed = 3-day projection
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-ink-soft/40 font-mono shrink-0">
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-0.5 bg-sage rounded" />
                      ≥65
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-0.5 bg-amber rounded" />
                      ≥40
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="inline-block w-3 h-0.5 bg-coral rounded" />
                      low
                    </span>
                  </div>
                </div>
                <ForecastChart
                  historical={wellnessHistorical}
                  projected={projectedComposites}
                  historicalDates={historicalDates}
                  inverted
                />
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="rounded-2xl bg-surface/60 border border-ink/5 px-5 py-4"
        >
          <p className="text-[11px] text-ink-soft/50 leading-relaxed">
            <span className="font-semibold text-ink-soft/70">How this works —</span>{" "}
            Thryve&#39;s ML models compute daily sick-leave, insomnia, and mental-health risk from
            your wearable data. Outliers are Winsorised before EWMA smoothing (α=0.3) removes
            day-to-day noise. Mistral generates three independent narratives in parallel — alert,
            briefing, and 3-day reasons — from the same underlying data context.
            {dataSource === "biometric-proxy" && " Thryve prediction scores unavailable — biometric proxy used."}
          </p>
        </motion.div>

        <div className="pt-4 border-t border-mint-dark/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-ink-soft/40">
          <span className="font-display text-sm font-medium text-ink-soft/60">
            vital<span className="text-sage">.</span>
          </span>
          <span className="sm:text-right">Prevention over treatment · Powered by Mistral × Alan × Thryve</span>
        </div>
      </div>
      <NewGoalDrawer
        open={promiseDrawerOpen}
        defaultTab="manual"
        prefillAbstract={promisePrefill}
        onClose={() => setPromiseDrawerOpen(false)}
        onCreated={() => setPromiseDrawerOpen(false)}
        existingGoalTitles={promises.map((g) => g.goal.title)}
      />
    </PageShell>
  );
}
