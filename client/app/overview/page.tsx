"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";
import PageShell from "@/components/PageShell";
import MetricCard from "@/components/MetricCard";
import TrendSparkline from "@/components/TrendSparkline";
import ForecastBadge from "@/components/ForecastBadge";
import ForecastChart from "@/components/ForecastChart";
import InsightCard from "@/components/InsightCard";
import SignalChip from "@/components/SignalChip";
import LiveBadge from "@/components/LiveBadge";
import CoachMessage from "@/components/CoachMessage";
import type {
  DayData,
  Trends,
  UserProfile,
  DailyBriefingResponse,
  ForecastResponse,
  RiskLevel,
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

const RISK_PILL = {
  low: "bg-sage/10 text-sage border-sage/20",
  moderate: "bg-amber/10 text-amber border-amber/20",
  high: "bg-coral/10 text-coral border-coral/20",
};

const RISK_DOT = {
  low: "bg-sage",
  moderate: "bg-amber",
  high: "bg-coral",
};

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

function OverviewSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <Skel className="h-6 w-48" />
      <Skel className="h-24 w-full rounded-3xl" />
      <Skel className="h-40 w-full rounded-3xl" />
      <div className="grid grid-cols-4 gap-4">
        <Skel className="h-32 rounded-3xl" />
        <Skel className="h-32 rounded-3xl" />
        <Skel className="h-32 rounded-3xl" />
        <Skel className="h-32 rounded-3xl" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Skel className="h-56 rounded-3xl" />
        <Skel className="h-56 rounded-3xl" />
        <Skel className="h-56 rounded-3xl" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function OverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const { profile, today, last14Days, trends7d, alert, briefing, forecast, wellnessTrend } = data;
  const { forecast: forecastDays, rescuePlan, computed } = forecast;
  const { currentScores, sleepDebtMin, historicalComposites, historicalDates, dataSource, insights = [] } = computed;

  // ── Derived series for sparklines ──
  const sleepTrend = last14Days.map((d) => d.sleep.durationMin / 60);
  const rhrTrend = last14Days.map((d) => d.heart.restingHr);

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
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* ══════════════════════════════════════════════════════════════
            HEADER
            ══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-ink-soft/50 mb-2">
              {formatFullDate(today.date)}
            </p>
            <h1 className="font-display text-4xl font-semibold text-ink">
              Good morning, {profile.name.split(" ")[0]}<span className="text-sage">.</span>
            </h1>
          </div>
          <LiveBadge source={dataSource} />
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            1. ALERT HERO — the single most urgent thing
            ══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className={clsx(
            "rounded-3xl border-2 p-6 flex items-start gap-4",
            alert.risk === "high"
              ? "bg-coral-light border-coral/30"
              : alert.risk === "moderate"
              ? "bg-amber-light border-amber/30"
              : "bg-mint border-mint-dark/40"
          )}
        >
          <div className="flex flex-col items-center gap-1 shrink-0">
            <span
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-widest",
                RISK_PILL[alert.risk]
              )}
            >
              {alert.risk === "high" ? (
                <motion.span
                  className={clsx("w-1.5 h-1.5 rounded-full", RISK_DOT[alert.risk])}
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
              ) : (
                <span className={clsx("w-1.5 h-1.5 rounded-full", RISK_DOT[alert.risk])} />
              )}
              {alert.risk} risk
            </span>
            <span className="font-mono text-3xl font-bold text-ink tabular-nums leading-none mt-1">
              {wellnessNow}
            </span>
            <span className="text-[10px] text-ink-soft/50 uppercase tracking-widest">/100</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/50 mb-1.5">
              Heads up
            </p>
            <p className="text-xl font-display font-semibold text-ink leading-snug">
              {alert.headline}
            </p>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            2. DAILY BRIEFING — warm narrative + insight + action
            ══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="rounded-3xl bg-mint/40 border border-mint-dark/30 p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
            <span className="text-[10px] font-medium uppercase tracking-widest text-sage">
              Vital Coach · Daily briefing
            </span>
          </div>
          <CoachMessage text={briefing.narrative} from="coach" typewriter speed={10} />
          <div className="h-px bg-mint-dark/40 my-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-sage mb-1">
                Top insight
              </p>
              <p className="text-sm text-ink leading-snug">{briefing.topInsight}</p>
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-sage mb-1">
                Action for today
              </p>
              <p className="text-sm text-ink leading-snug">→ {briefing.actionTip}</p>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            3. KEY METRICS — 4 cards
            ══════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            label="Wellness score"
            value={String(wellnessNow)}
            unit="/100"
            trend={wellnessTrend}
            trendColor="#1A6B4A"
            trendFill="#D8EDE2"
            note={`Sick-leave ${currentScores.sickLeave}/100 · Insomnia ${currentScores.insomniaRisk}/100`}
            delay={0.3}
          />
          <MetricCard
            label="Sleep debt (7d)"
            value={`${sleepDebtH}h${String(sleepDebtM).padStart(2, "0")}`}
            unit=""
            note={
              sleepDebtMin > 300
                ? "Significant debt — aim for full recovery nights"
                : sleepDebtMin > 120
                ? "Moderate debt — bank extra sleep this week"
                : "Sleep debt under control"
            }
            delay={0.35}
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            4. 3-DAY FORECAST
            ══════════════════════════════════════════════════════════════ */}
        <div>
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/50 mb-1">
                Predictive health
              </p>
              <h2 className="font-display text-2xl font-semibold text-ink">
                3-day forecast<span className="text-sage">.</span>
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {forecastDays.map((day, i) => (
              <ForecastBadge
                key={day.date + day.label}
                label={day.label}
                date={day.date}
                risk={day.risk}
                reason={day.reason}
                composite={day.composite}
                delay={0.4 + i * 0.08}
              />
            ))}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            5. RESCUE PLAN — immediately below forecast, if needed
            ══════════════════════════════════════════════════════════════ */}
        {rescuePlan.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.4 }}
            className="rounded-3xl bg-white/80 border border-mint-dark/30 shadow-sm p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-sage" />
              <h2 className="text-xs font-medium uppercase tracking-widest text-sage">
                {highestRisk.label} rescue plan
              </h2>
              <span
                className={clsx(
                  "ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                  highestRisk.risk === "high" ? "bg-coral-light text-coral" : "bg-amber-light text-amber"
                )}
              >
                {highestRisk.composite}/100
              </span>
            </div>
            <div className="flex flex-col gap-5">
              {rescuePlan.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.07, duration: 0.3 }}
                  className="flex gap-4"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-mint flex items-center justify-center text-xs font-bold text-sage font-mono mt-0.5">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink mb-0.5">{item.action}</p>
                    <p className="text-xs text-ink-soft leading-relaxed">{item.why}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            6. CURRENT SIGNALS — 4 chips
            ══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.75 }}
        >
          <p className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/40 mb-3">
            Current signals
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SignalChip
              label="Recovery score"
              value={100 - currentScores.sickLeave}
              unit="/100"
              level={currentScores.sickLeave >= 65 ? "alert" : currentScores.sickLeave >= 40 ? "warn" : "ok"}
              delay={0.78}
            />
            <SignalChip
              label="Sleep score"
              value={100 - currentScores.insomniaRisk}
              unit="/100"
              level={currentScores.insomniaRisk >= 65 ? "alert" : currentScores.insomniaRisk >= 40 ? "warn" : "ok"}
              delay={0.82}
            />
            <SignalChip
              label="Mental score"
              value={100 - currentScores.mentalHealthRisk}
              unit="/100"
              level={currentScores.mentalHealthRisk >= 65 ? "alert" : currentScores.mentalHealthRisk >= 40 ? "warn" : "ok"}
              delay={0.86}
            />
            <SignalChip
              label="Sleep debt (7d)"
              value={`${sleepDebtH}h ${String(sleepDebtM).padStart(2, "0")}m`}
              level={sleepDebtMin > 300 ? "alert" : sleepDebtMin > 120 ? "warn" : "ok"}
              delay={0.9}
            />
          </div>
        </motion.div>

        {/* ══════════════════════════════════════════════════════════════
            7. INSIGHTS — what's driving the forecast
            ══════════════════════════════════════════════════════════════ */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <p className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/40 mb-3">
              What your body is telling you
            </p>
            <div className="flex flex-col gap-3">
              {insights.map((ins, i) => (
                <InsightCard key={ins.id} insight={ins} delay={0.95 + i * 0.06} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            8. WELLNESS TREND CHART
            ══════════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {historicalComposites.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="rounded-3xl bg-white/80 border border-mint-dark/30 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-widest text-ink-soft/50">
                    Wellness score
                  </p>
                  <p className="text-xs text-ink-soft/40 mt-0.5">
                    Solid = history (EWMA) · Dashed = 3-day projection
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-ink-soft/40 font-mono">
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-sage rounded" />≥65</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-amber rounded" />≥40</span>
                  <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-coral rounded" />low</span>
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

        {/* ══════════════════════════════════════════════════════════════
            METHODOLOGY FOOTNOTE
            ══════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
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

        {/* Brand footer */}
        <div className="pt-6 border-t border-mint-dark/30 flex items-center justify-between text-xs text-ink-soft/40">
          <span className="font-display text-sm font-medium text-ink-soft/60">
            vital<span className="text-sage">.</span>
          </span>
          <span>Prevention over treatment · Powered by Mistral × Alan × Thryve</span>
        </div>
      </div>
    </PageShell>
  );
}
