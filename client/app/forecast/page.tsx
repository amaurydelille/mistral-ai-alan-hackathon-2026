"use client";

import { motion } from "motion/react";
import PageShell from "@/components/PageShell";
import ForecastBadge from "@/components/ForecastBadge";
import { forecast } from "@/lib/mock-data";
import { forecastRescuePlan } from "@/lib/coach-copy";

export default function ForecastPage() {
  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-2"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-ink-soft/50 mb-2">
            Predictive health
          </p>
          <h1 className="font-display text-4xl font-semibold text-ink mb-3">
            Your 3-day forecast
            <span className="text-sage">.</span>
          </h1>
          <p className="text-ink-soft max-w-lg">
            Based on your HRV, sleep debt, and resting HR trends over 14 days.
            Not a guess — a pattern.
          </p>
        </motion.div>

        {/* Forecast cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 mb-10">
          {forecast.map((day, i) => (
            <ForecastBadge
              key={day.date + day.label}
              label={day.label}
              date={day.date}
              risk={day.risk}
              reason={day.reason}
              delay={i * 0.1}
            />
          ))}
        </div>

        {/* Rescue plan */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="rounded-3xl bg-white/80 border border-mint-dark/30 shadow-sm p-6"
        >
          <div className="flex items-center gap-2 mb-6">
            <div className="w-2 h-2 rounded-full bg-sage" />
            <h2 className="text-xs font-medium uppercase tracking-widest text-sage">
              Thursday rescue plan
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            {forecastRescuePlan.map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-mint flex items-center justify-center text-xs font-bold text-sage font-mono">
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink mb-0.5">{item.action}</p>
                  <p className="text-xs text-ink-soft leading-relaxed">{item.why}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Science callout */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-xs text-ink-soft/50 text-center"
        >
          HRV decline + rising RHR + sleep debt are established precursors of
          illness, burnout and injury — the science is well-established.
        </motion.p>
      </div>
    </PageShell>
  );
}
