"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import PromiseCard from "@/components/PromiseCard";
import NewGoalDrawer from "@/components/NewGoalDrawer";
import type { Goal, GoalWithProgress } from "@/lib/types";

export default function PromisesPage() {
  const router = useRouter();
  const [goalsData, setGoalsData] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDefaultTab, setDrawerDefaultTab] = useState<"suggest" | "manual">("suggest");

  const fetchGoals = useCallback(() => {
    setLoading(true);
    fetch("/api/goals")
      .then((r) => r.json())
      .then((d: GoalWithProgress[]) => {
        setGoalsData(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const primaryEntry = goalsData.find((g) => g.goal.isPrimary);
  const otherEntries = goalsData.filter((g) => !g.goal.isPrimary);
  const isEmpty = !loading && goalsData.length === 0;

  function handleCreated(_goal: Goal) {
    fetchGoals();
  }

  async function handleArchive(id: string) {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    setGoalsData((prev) => prev.filter((g) => g.goal.id !== id));
  }

  // Summary counts for the header banner
  const keptCount = goalsData.filter((g) => g.progress.status === "achieved").length;
  const brokenCount = goalsData.filter((g) => g.progress.status === "off-track").length;
  const atRiskCount = goalsData.filter((g) => g.progress.status === "at-risk").length;
  const total = goalsData.length;

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-10">

        {/* ── Page header ── */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-end justify-between"
        >
          <div>
            <p className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/40 mb-1">
              Your commitments
            </p>
            <h1 className="font-display text-3xl font-semibold text-ink leading-tight">
              Promises<span className="text-sage">.</span>
            </h1>
          </div>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => { setDrawerDefaultTab("suggest"); setDrawerOpen(true); }}
            className="flex items-center gap-1.5 rounded-full bg-sage px-5 py-2.5 text-sm font-semibold text-cream hover:bg-sage-dark transition-colors shadow-lg shadow-sage/20"
          >
            <span className="text-base leading-none">+</span>
            New promise
          </motion.button>
        </motion.div>

        {/* ── Summary banner (when data loaded) ── */}
        <AnimatePresence>
          {!loading && total > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="rounded-2xl bg-white/60 border border-mint-dark/20 px-5 py-4 flex items-center gap-6"
            >
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-2xl font-display font-bold text-sage">{keptCount}</span>
                <span className="text-[10px] uppercase tracking-widest text-ink-soft/50">kept</span>
              </div>
              <div className="w-px h-8 bg-mint-dark/20" />
              <div className="flex flex-col items-center gap-0.5">
                <span className="text-2xl font-display font-bold text-coral">{brokenCount}</span>
                <span className="text-[10px] uppercase tracking-widest text-ink-soft/50">broken</span>
              </div>
              {atRiskCount > 0 && (
                <>
                  <div className="w-px h-8 bg-mint-dark/20" />
                  <div className="flex flex-col items-center gap-0.5">
                    <span className="text-2xl font-display font-bold text-amber-500">{atRiskCount}</span>
                    <span className="text-[10px] uppercase tracking-widest text-ink-soft/50">at risk</span>
                  </div>
                </>
              )}
              <div className="ml-auto text-right">
                <p className="text-xs text-ink-soft/50">
                  {total} active {total === 1 ? "promise" : "promises"}
                </p>
                {keptCount === total && total > 0 && (
                  <p className="text-xs font-semibold text-sage">Perfect day 🔥</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="flex flex-col gap-5">
            <div className="h-3 w-32 bg-ink/6 rounded-full animate-pulse" />
            <div className="h-56 rounded-3xl bg-ink/6 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-44 rounded-3xl bg-ink/6 animate-pulse" />
              <div className="h-44 rounded-3xl bg-ink/6 animate-pulse" />
            </div>
          </div>
        )}

        {/* ── Empty state ── */}
        {isEmpty && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-5 py-20 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-sage/20 to-mint/40 flex items-center justify-center text-3xl shadow-inner">
              🤝
            </div>
            <div>
              <p className="text-lg font-semibold text-ink mb-1">No promises yet.</p>
              <p className="text-sm text-ink-soft/60 max-w-xs leading-relaxed">
                A promise is a commitment you make to yourself based on what your data says you need.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setDrawerDefaultTab("suggest"); setDrawerOpen(true); }}
                className="rounded-full bg-sage px-6 py-3 text-sm font-semibold text-cream hover:bg-sage-dark transition-colors shadow-lg shadow-sage/20"
              >
                Let coach suggest
              </button>
              <button
                onClick={() => { setDrawerDefaultTab("manual"); setDrawerOpen(true); }}
                className="rounded-full border border-ink/15 bg-white/60 px-6 py-3 text-sm font-medium text-ink-soft hover:text-ink hover:border-ink/25 transition-colors"
              >
                Set my own
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Hero: primary (focus) promise ── */}
        {!loading && primaryEntry && (
          <div className="flex flex-col gap-3">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-[10px] font-medium uppercase tracking-widest text-sage"
            >
              Today&apos;s focus
            </motion.p>
            <PromiseCard
              goal={primaryEntry.goal}
              initialPercentComplete={primaryEntry.progress.percentComplete}
              initialStatus={primaryEntry.progress.status}
              initialValue={primaryEntry.progress.currentValue}
              delay={0.18}
              onArchive={handleArchive}
              hero
            />
          </div>
        )}

        {/* ── Other active promises ── */}
        {!loading && otherEntries.length > 0 && (
          <div className="flex flex-col gap-4">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/40"
            >
              Active promises
            </motion.p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherEntries.map(({ goal, progress }, i) => (
                <PromiseCard
                  key={goal.id}
                  goal={goal}
                  initialPercentComplete={progress.percentComplete}
                  initialStatus={progress.status}
                  initialValue={progress.currentValue}
                  delay={0.4 + i * 0.07}
                  onArchive={handleArchive}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── No focus goal nudge ── */}
        {!loading && !primaryEntry && otherEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-dashed border-sage/30 p-5 flex items-center justify-between gap-4"
          >
            <div>
              <p className="text-sm font-medium text-ink mb-0.5">Pin a focus promise</p>
              <p className="text-xs text-ink-soft/60 leading-snug">
                Your coach builds your daily briefing around it.
              </p>
            </div>
            <button
              onClick={() => { setDrawerDefaultTab("suggest"); setDrawerOpen(true); }}
              className="shrink-0 rounded-full bg-sage/10 px-4 py-2 text-sm font-medium text-sage hover:bg-sage/20 transition-colors"
            >
              Set focus →
            </button>
          </motion.div>
        )}

        {/* ── Back to dashboard CTA ── */}
        {!loading && total > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="flex justify-center pt-2"
          >
            <button
              onClick={() => router.push("/dashboard")}
              className="text-xs text-ink-soft/40 hover:text-ink-soft/70 transition-colors"
            >
              ← Back to dashboard
            </button>
          </motion.div>
        )}

      </div>

      <NewGoalDrawer
        open={drawerOpen}
        defaultTab={drawerDefaultTab}
        onClose={() => setDrawerOpen(false)}
        onCreated={handleCreated}
      />
    </PageShell>
  );
}
