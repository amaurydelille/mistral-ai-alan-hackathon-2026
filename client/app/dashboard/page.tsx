"use client";

import { useState } from "react";
import { motion } from "motion/react";
import PageShell from "@/components/PageShell";
import MetricCard from "@/components/MetricCard";
import CoachMessage from "@/components/CoachMessage";
import TrendSparkline from "@/components/TrendSparkline";
import { today, last14Days, trends7d } from "@/lib/mock-data";
import { dashboardBriefing } from "@/lib/coach-copy";

const sleepTrend = last14Days.map((d) => d.sleep.durationMin / 60);
const hrvTrend = last14Days.map((d) => d.heart.hrvMs);
const stressTrend = last14Days.map((d) => d.selfReported.stress);
const rhrTrend = last14Days.map((d) => d.heart.restingHr);
const stepsTrend = last14Days.map((d) => d.activity.steps / 1000);

const sleepHours = (today.sleep.durationMin / 60).toFixed(1);
const deepPct = Math.round((today.sleep.deepMin / today.sleep.durationMin) * 100);

export default function DashboardPage() {
  const [briefingDone, setBriefingDone] = useState(false);

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
            Friday, April 11 · 2026
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
            note={`Only ${today.sleep.deepMin}min deep sleep (${deepPct}% of total) · ${today.sleep.wakeUps} wake-ups`}
            size="hero"
            className="lg:col-span-2"
            delay={0.05}
          />

          {/* HRV */}
          <MetricCard
            label="HRV this morning"
            value={String(today.heart.hrvMs)}
            unit="ms"
            trend={hrvTrend}
            trendColor="#D86849"
            trendFill="#FCEEE9"
            note={`Baseline: ${45}ms · 7d avg: ${trends7d.avgHrv}ms · ${trends7d.hrvTrend}`}
            delay={0.1}
          />

          {/* RHR */}
          <MetricCard
            label="Resting heart rate"
            value={String(today.heart.restingHr)}
            unit="bpm"
            trend={rhrTrend}
            trendColor="#D86849"
            trendFill="#FCEEE9"
            note={`Baseline: 56bpm · Rising for 8 days`}
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
            {/* Sleep */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">Sleep duration</span>
                <span className="text-xs text-coral font-mono">↓ 18min avg this week</span>
              </div>
              <TrendSparkline data={sleepTrend} width={240} height={56} color="#D86849" fillColor="#FCEEE9" />
              <div className="flex justify-between text-xs text-ink-soft/50 font-mono">
                <span>Mar 29</span>
                <span>Apr 11</span>
              </div>
            </div>

            {/* HRV */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">HRV</span>
                <span className="text-xs text-coral font-mono">↓ 16ms vs baseline</span>
              </div>
              <TrendSparkline data={hrvTrend} width={240} height={56} color="#D86849" fillColor="#FCEEE9" />
              <div className="flex justify-between text-xs text-ink-soft/50 font-mono">
                <span>Mar 29</span>
                <span>Apr 11</span>
              </div>
            </div>

            {/* Steps */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-ink">Daily steps (k)</span>
                <span className="text-xs text-coral font-mono">↓ 1.5k avg this week</span>
              </div>
              <TrendSparkline data={stepsTrend} width={240} height={56} color="#1A6B4A" fillColor="#D8EDE2" />
              <div className="flex justify-between text-xs text-ink-soft/50 font-mono">
                <span>Mar 29</span>
                <span>Apr 11</span>
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
