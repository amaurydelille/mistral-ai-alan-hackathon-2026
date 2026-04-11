"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import PageShell from "@/components/PageShell";
import MetricCard from "@/components/MetricCard";
import TrendSparkline from "@/components/TrendSparkline";
import { dashboardBriefing } from "@/lib/coach-copy";
import type { DayData, Trends, WeeklyMetric, UserProfile, DailyBriefingResponse } from "@/lib/types";
import type { ThryveScore } from "@/lib/thryve-transform";
import { ewma, compositeScore } from "@/lib/forecast";

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

function parseBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**")
      ? <strong key={i} className="font-semibold text-ink">{part.slice(2, -2)}</strong>
      : <span key={i}>{part}</span>
  );
}

function BoldText({ text, className }: { text: string; className?: string }) {
  return <p className={className}>{parseBold(text)}</p>;
}

export default function DashboardPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [briefing, setBriefing] = useState<DailyBriefingResponse | null>(null);
  const [briefingText, setBriefingText] = useState<string | null>(null);
  const [displayed, setDisplayed] = useState("");
  const [loading, setLoading] = useState(true);
  const [briefingDone, setBriefingDone] = useState(false);
  const idxRef = useRef(0);

  useEffect(() => {
    fetch("/api/health?days=28")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/daily-briefing")
      .then((r) => r.json())
      .then((d: DailyBriefingResponse) => {
        setBriefing(d);
        setBriefingText(d.narrative);
      })
      .catch(() => setBriefingText(dashboardBriefing));
  }, []);

  // Typewriter — runs exactly once when briefingText is first set.
  // Strip **markers** so they never appear mid-animation; bold is applied after.
  useEffect(() => {
    if (!briefingText) return;
    const plain = briefingText.replace(/\*\*/g, "");
    setDisplayed("");
    setBriefingDone(false);
    idxRef.current = 0;
    const tick = () => {
      idxRef.current++;
      setDisplayed(plain.slice(0, idxRef.current));
      if (idxRef.current < plain.length) {
        timerId = setTimeout(tick, 12);
      } else {
        setBriefingDone(true);
      }
    };
    let timerId = setTimeout(tick, 40);
    return () => clearTimeout(timerId);
  }, [briefingText]);

  if (loading) {
    return (
      <PageShell>
        <div className="max-w-6xl mx-auto px-6 py-8 animate-pulse opacity-40">
          <div className="h-5 w-36 bg-ink/10 rounded mb-2" />
          <div className="h-9 w-64 bg-ink/10 rounded mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">
            <div className="h-56 bg-ink/10 rounded-3xl" />
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="h-40 bg-ink/10 rounded-3xl" />
                <div className="h-40 bg-ink/10 rounded-3xl" />
                <div className="h-40 bg-ink/10 rounded-3xl" />
              </div>
              <div className="h-36 bg-ink/10 rounded-3xl" />
            </div>
          </div>
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

  const sleepTrend = last14Days.map((d) => d.sleep.durationMin / 60);
  const deepSleepTrend = last14Days.map((d) => d.sleep.deepMin);
  const rhrTrend = last14Days.map((d) => d.heart.restingHr);
  const stepsTrend = last14Days.map((d) => d.activity.steps / 1000);

  const sleepHours = (today.sleep.durationMin / 60).toFixed(1);
  const deepPct =
    today.sleep.durationMin > 0
      ? Math.round((today.sleep.deepMin / today.sleep.durationMin) * 100)
      : 0;

  let wellnessScore: number | null = null;
  let wellnessTrend: number[] = [];
  let wellnessNote = "No Thryve score available yet";

  if (thryveScores.length >= 3) {
    const recent = thryveScores.slice(-14);
    const sickLeaveSmooth = ewma(recent.map((s) => s.sickLeave));
    const insomniaSmooth = ewma(recent.map((s) => s.insomniaRisk));
    const mentalSmooth = ewma(recent.map((s) => s.mentalHealthRisk));
    const compositeSmooth = sickLeaveSmooth.map((sl, i) =>
      compositeScore(sl, insomniaSmooth[i], mentalSmooth[i])
    );
    wellnessTrend = compositeSmooth.map((c) => Math.round(100 - c));
    wellnessScore = wellnessTrend[wellnessTrend.length - 1];
    const n = sickLeaveSmooth.length - 1;
    wellnessNote = `Sick leave risk: ${Math.round(sickLeaveSmooth[n])}/100 · Insomnia: ${Math.round(insomniaSmooth[n])}/100`;
  }

  const startLabel = last14Days.length > 0 ? formatDate(last14Days[0].date) : "";
  const endLabel = last14Days.length > 0 ? formatDate(last14Days[last14Days.length - 1].date) : "";

  const rhrLabel =
    trends7d.rhrTrend === "rising"
      ? "↑ rising"
      : trends7d.rhrTrend === "declining"
      ? "↓ declining"
      : "→ stable";

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
          className="mb-6"
        >
          <p className="text-xs text-ink-soft/50 font-mono mb-1">
            {formatFullDate(today.date)}
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Good morning, Amaury
            <span className="text-sage">.</span>
          </h1>
        </motion.div>

        {/* Main layout: briefing panel + metrics/charts */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">

          {/* ── LEFT: Compact briefing panel ── */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="rounded-3xl bg-mint/40 border border-mint-dark/30 p-5 lg:sticky lg:top-6"
          >
            <div className="flex items-center gap-1.5 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-sage">
                Vital Coach
              </span>
            </div>

            {briefingText === null ? (
              <div className="flex flex-col gap-2">
                <div className="h-2.5 bg-ink/8 rounded-full w-full animate-pulse" />
                <div className="h-2.5 bg-ink/8 rounded-full w-5/6 animate-pulse" />
                <div className="h-2.5 bg-ink/8 rounded-full w-4/6 animate-pulse" />
                <div className="h-2.5 bg-ink/8 rounded-full w-3/5 animate-pulse" />
              </div>
            ) : briefingDone ? (
              <BoldText text={briefingText} className="text-sm text-ink leading-relaxed" />
            ) : (
              <p className="text-sm text-ink leading-relaxed">
                {displayed}
                <span className="inline-block w-0.5 h-3.5 bg-sage ml-0.5 animate-pulse align-text-bottom" />
              </p>
            )}

            {briefingDone && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-4 flex flex-col gap-3"
              >
                <div className="h-px bg-mint-dark/50" />
                {briefing && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-ink font-medium leading-snug">
                      <span className="text-sage mr-1">💡</span>
                      {parseBold(briefing.topInsight)}
                    </p>
                    <p className="text-xs text-ink-soft/70 leading-snug">
                      <span className="mr-1">→</span>
                      {parseBold(briefing.actionTip)}
                    </p>
                  </div>
                )}
                <a
                  href="/forecast"
                  className="self-start rounded-full bg-sage px-4 py-2 text-xs font-medium text-cream hover:bg-sage-dark transition-colors"
                >
                  See forecast →
                </a>
              </motion.div>
            )}
          </motion.div>

          {/* ── RIGHT: Metrics + 14-day trends ── */}
          <div className="flex flex-col gap-4">

            {/* 3 metric cards — equal width */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                delay={0.15}
              />

              <MetricCard
                label="Resting heart rate"
                value={String(today.heart.restingHr)}
                unit="bpm"
                trend={rhrTrend}
                trendColor="#D86849"
                trendFill="#FCEEE9"
                note={`${profile.baselineRhr}bpm baseline · ${trends7d.avgRhr}bpm 7d avg · ${rhrLabel}`}
                delay={0.2}
              />

              <MetricCard
                label="Wellness score"
                value={wellnessScore !== null ? String(wellnessScore) : "—"}
                unit="/100"
                trend={wellnessTrend}
                trendColor="#1A6B4A"
                trendFill="#D8EDE2"
                note={wellnessNote}
                delay={0.25}
              />
            </div>

            {/* 14-day trend strip */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="rounded-3xl bg-white/80 border border-mint-dark/30 shadow-sm p-5"
            >
              <h2 className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/50 mb-4">
                14-day trends
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink">Sleep</span>
                    <span className="text-[10px] text-coral font-mono">
                      {trends7d.avgSleepDuration > 0
                        ? `${Math.floor(trends7d.avgSleepDuration / 60)}h ${trends7d.avgSleepDuration % 60}m avg`
                        : "—"}
                    </span>
                  </div>
                  <TrendSparkline data={sleepTrend} height={48} color="#D86849" fillColor="#FCEEE9" />
                  <div className="flex justify-between text-[10px] text-ink-soft/40 font-mono">
                    <span>{startLabel}</span>
                    <span>{endLabel}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink">Deep sleep</span>
                    <span className="text-[10px] text-coral font-mono">
                      {trends7d.avgDeepSleep > 0
                        ? `${trends7d.avgDeepSleep}min · ${deepSleepLabel}`
                        : "—"}
                    </span>
                  </div>
                  <TrendSparkline data={deepSleepTrend} height={48} color="#D86849" fillColor="#FCEEE9" />
                  <div className="flex justify-between text-[10px] text-ink-soft/40 font-mono">
                    <span>{startLabel}</span>
                    <span>{endLabel}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-ink">Steps</span>
                    <span className="text-[10px] text-sage font-mono">
                      {trends7d.avgSteps > 0
                        ? `${(trends7d.avgSteps / 1000).toFixed(1)}k avg`
                        : "—"}
                    </span>
                  </div>
                  <TrendSparkline data={stepsTrend} height={48} color="#1A6B4A" fillColor="#D8EDE2" />
                  <div className="flex justify-between text-[10px] text-ink-soft/40 font-mono">
                    <span>{startLabel}</span>
                    <span>{endLabel}</span>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>
        </div>

      </div>
    </PageShell>
  );
}
