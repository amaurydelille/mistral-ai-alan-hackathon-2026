"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import PageShell from "@/components/PageShell";
import MetricCard from "@/components/MetricCard";
import CoachMessage from "@/components/CoachMessage";
import TrendSparkline from "@/components/TrendSparkline";
import { dashboardBriefing } from "@/lib/coach-copy";
import type { DayData, Trends, WeeklyMetric, UserProfile } from "@/lib/types";
import type { ThryveScore } from "@/lib/thryve-transform";

interface HealthData {
  profile: UserProfile;
  today: DayData;
  last14Days: DayData[];
  trends7d: Trends;
  trends30d: Trends;
  weeklyMetrics: WeeklyMetric[];
  thryveScores: ThryveScore[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [briefingDone, setBriefingDone] = useState(false);

  useEffect(() => {
    fetch("/api/health?days=28")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <PageShell>
        <div className="max-w-6xl mx-auto px-6 py-8 animate-pulse opacity-40">
          <div className="h-6 w-40 bg-ink/10 rounded mb-2" />
          <div className="h-10 w-72 bg-ink/10 rounded mb-8" />
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
            <div className="lg:col-span-2 h-48 bg-ink/10 rounded-3xl" />
            <div className="h-48 bg-ink/10 rounded-3xl" />
            <div className="h-48 bg-ink/10 rounded-3xl" />
          </div>
          <div className="h-48 bg-ink/10 rounded-3xl mb-8" />
          <div className="h-36 bg-ink/10 rounded-3xl" />
        </div>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <p className="text-ink-soft/60">Unable to load health data.</p>
        </div>
      </PageShell>
    );
  }

  const { profile, today, last14Days, trends7d, thryveScores } = data;

  // --- Derived trend arrays (14-day history) ---
  const sleepTrend = last14Days.map((d) => d.sleep.durationMin / 60);
  const deepSleepTrend = last14Days.map((d) => d.sleep.deepMin);
  const rhrTrend = last14Days.map((d) => d.heart.restingHr);
  const stepsTrend = last14Days.map((d) => d.activity.steps / 1000);

  // --- Today's computed values ---
  const sleepHours = (today.sleep.durationMin / 60).toFixed(1);
  const deepPct =
    today.sleep.durationMin > 0
      ? Math.round((today.sleep.deepMin / today.sleep.durationMin) * 100)
      : 0;

  // --- Thryve risk scores (latest available) ---
  const latestScore = thryveScores.length
    ? thryveScores[thryveScores.length - 1]
    : null;

  // --- Date range labels for trend strip ---
  const startLabel = last14Days.length > 0 ? formatDate(last14Days[0].date) : "";
  const endLabel =
    last14Days.length > 0 ? formatDate(last14Days[last14Days.length - 1].date) : "";

  // --- Trend labels ---
  const rhrLabel =
    trends7d.rhrTrend === "rising"
      ? "↑ rising this week"
      : trends7d.rhrTrend === "declining"
      ? "↓ declining this week"
      : "→ stable this week";

  const deepSleepLabel =
    trends7d.deepSleepTrend === "declining"
      ? "↓ declining"
      : trends7d.deepSleepTrend === "improving"
      ? "↑ improving"
      : "→ stable";

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <p className="text-sm text-ink-soft/60 font-mono mb-1">
            {formatFullDate(today.date)}
          </p>
          <h1 className="font-display text-4xl font-semibold text-ink">
            Good morning, Marie
            <span className="text-sage">.</span>
          </h1>
        </motion.div>

        {/* Hero + supporting metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          {/* Hero — last night's sleep */}
          <MetricCard
            label="Last night's sleep"
            value={sleepHours}
            unit="h"
            trend={sleepTrend}
            trendColor="#D86849"
            trendFill="#FCEEE9"
            note={
              today.sleep.deepMin > 0
                ? `${today.sleep.deepMin}min deep (${deepPct}%) · ${today.sleep.wakeUps} wake-ups · efficiency ${Math.round(today.sleep.efficiency * 100)}%`
                : `${today.sleep.wakeUps} wake-ups · efficiency ${Math.round(today.sleep.efficiency * 100)}%`
            }
            size="hero"
            className="lg:col-span-2"
            delay={0.05}
          />

          {/* Resting HR */}
          <MetricCard
            label="Resting heart rate"
            value={String(today.heart.restingHr)}
            unit="bpm"
            trend={rhrTrend}
            trendColor="#D86849"
            trendFill="#FCEEE9"
            note={`Baseline: ${profile.baselineRhr}bpm · 7d avg: ${trends7d.avgRhr}bpm · ${rhrLabel}`}
            delay={0.1}
          />

          {/* Sick Leave Risk (Thryve score) — replaces HRV which Withings doesn't provide */}
          <MetricCard
            label="Sick leave risk"
            value={latestScore ? String(latestScore.sickLeave) : "—"}
            unit="/100"
            trendColor="#D86849"
            trendFill="#FCEEE9"
            note={
              latestScore
                ? `Insomnia: ${latestScore.insomniaRisk}/100 · Cardiovascular: ${latestScore.cardiovascularRisk}/100`
                : "No Thryve score available yet"
            }
            delay={0.15}
          />
        </div>

        {/* 14-day trend strip */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-3xl bg-white/80 border border-mint-dark/30 shadow-sm p-6 mb-8"
        >
          <h2 className="text-xs font-medium uppercase tracking-widest text-ink-soft/60 mb-6">
            14-day trends
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {/* Sleep duration */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">Sleep duration</span>
                <span className="text-xs text-coral font-mono">
                  {trends7d.avgSleepDuration > 0
                    ? `${Math.floor(trends7d.avgSleepDuration / 60)}h ${trends7d.avgSleepDuration % 60}m avg`
                    : "—"}
                </span>
              </div>
              <TrendSparkline data={sleepTrend} width={240} height={56} color="#D86849" fillColor="#FCEEE9" />
              <div className="flex justify-between text-xs text-ink-soft/50 font-mono">
                <span>{startLabel}</span>
                <span>{endLabel}</span>
              </div>
            </div>

            {/* Deep sleep — replaces HRV (not available from Withings) */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">Deep sleep</span>
                <span className="text-xs text-coral font-mono">
                  {trends7d.avgDeepSleep > 0
                    ? `${trends7d.avgDeepSleep}min avg · ${deepSleepLabel}`
                    : "—"}
                </span>
              </div>
              <TrendSparkline data={deepSleepTrend} width={240} height={56} color="#D86849" fillColor="#FCEEE9" />
              <div className="flex justify-between text-xs text-ink-soft/50 font-mono">
                <span>{startLabel}</span>
                <span>{endLabel}</span>
              </div>
            </div>

            {/* Daily steps */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">Daily steps (k)</span>
                <span className="text-xs text-coral font-mono">
                  {trends7d.avgSteps > 0
                    ? `${(trends7d.avgSteps / 1000).toFixed(1)}k avg`
                    : "—"}
                </span>
              </div>
              <TrendSparkline data={stepsTrend} width={240} height={56} color="#1A6B4A" fillColor="#D8EDE2" />
              <div className="flex justify-between text-xs text-ink-soft/50 font-mono">
                <span>{startLabel}</span>
                <span>{endLabel}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* AI briefing */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="rounded-3xl bg-mint/40 border border-mint-dark/30 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
            <span className="text-xs font-medium uppercase tracking-widest text-sage">
              Daily briefing · Vital Coach
            </span>
          </div>

          <CoachMessage
            text={dashboardBriefing}
            from="coach"
            typewriter={true}
            speed={12}
            onDone={() => setBriefingDone(true)}
          />

          {briefingDone && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 flex gap-3"
            >
              <a
                href="/forecast"
                className="rounded-full bg-sage px-5 py-2.5 text-sm font-medium text-cream hover:bg-sage-dark transition-colors"
              >
                See body forecast →
              </a>
            </motion.div>
          )}
        </motion.div>
      </div>
    </PageShell>
  );
}
