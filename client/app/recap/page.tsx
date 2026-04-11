"use client";

import { motion } from "motion/react";
import PageShell from "@/components/PageShell";
import CoachMessage from "@/components/CoachMessage";
import { weeklyMetrics } from "@/lib/mock-data";
import { weeklyRecap } from "@/lib/coach-copy";

export default function RecapPage() {
  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Editorial header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-ink-soft/50 mb-4">
            Weekly recap · Apr 5 – Apr 11
          </p>

          {/* Pull-quote headline */}
          <blockquote className="font-display text-4xl md:text-5xl font-semibold text-ink leading-[1.1] mb-6 max-w-2xl">
            &ldquo;{weeklyRecap.headline}&rdquo;
          </blockquote>

          <div className="h-px bg-mint-dark/40 w-full" />
        </motion.div>

        {/* Weekly metrics grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {weeklyMetrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="rounded-2xl bg-white/80 border border-mint-dark/30 shadow-sm p-5"
            >
              <p className="text-xs font-medium uppercase tracking-widest text-ink-soft/50 mb-3">
                {m.label}
              </p>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="font-mono text-2xl font-semibold text-ink">
                  {m.value}
                </span>
                {m.unit && (
                  <span className="text-sm text-ink-soft">{m.unit}</span>
                )}
              </div>
              <div
                className={`text-xs font-medium ${
                  m.delta < 0 ? "text-coral" : "text-sage"
                }`}
              >
                {m.delta > 0 ? "+" : ""}
                {m.delta}
                <span className="font-normal text-ink-soft/50 ml-1">
                  {m.deltaLabel}
                </span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* AI narrative */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-3xl bg-mint/40 border border-mint-dark/30 p-6 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
            <span className="text-xs font-medium uppercase tracking-widest text-sage">
              Weekly narrative · Vital Coach
            </span>
          </div>

          <CoachMessage
            text={weeklyRecap.narrative}
            from="coach"
            typewriter
            speed={8}
          />
        </motion.div>

        {/* Next week goal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl bg-sage/5 border border-sage/20 px-6 py-5 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center text-sage text-sm font-bold flex-shrink-0">
            →
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-sage mb-1">
              Next week&apos;s goal
            </p>
            <p className="text-sm font-medium text-ink">{weeklyRecap.nextWeekGoal}</p>
          </div>
        </motion.div>

        {/* Brand footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-12 pt-6 border-t border-mint-dark/30 flex items-center justify-between text-xs text-ink-soft/40"
        >
          <span className="font-display text-sm font-medium text-ink-soft/60">
            vital<span className="text-sage">.</span>
          </span>
          <span>Prevention over treatment · Powered by Mistral × Alan</span>
        </motion.div>
      </div>
    </PageShell>
  );
}
