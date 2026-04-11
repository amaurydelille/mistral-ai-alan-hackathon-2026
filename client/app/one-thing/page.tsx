"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import PageShell from "@/components/PageShell";
import GoalCard from "@/components/GoalCard";
import NewGoalDrawer from "@/components/NewGoalDrawer";
import type { Goal, GoalWithProgress } from "@/lib/types";

export default function OneThingPage() {
  const [goalsData, setGoalsData] = useState<GoalWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDefaultTab, setDrawerDefaultTab] = useState<"suggest" | "manual">("suggest");
  const [committed, setCommitted] = useState(false);

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

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  // Primary = hero focus goal. All goals (including primary) shown as cards.
  const primaryEntry = goalsData.find((g) => g.goal.isPrimary);
  const otherEntries = goalsData.filter((g) => !g.goal.isPrimary);

  function handleCreated(_goal: Goal) {
    fetchGoals();
  }

  async function handleArchive(id: string) {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    setGoalsData((prev) => prev.filter((g) => g.goal.id !== id));
  }

  const isEmpty = !loading && goalsData.length === 0;

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
              One Thing
            </p>
            <h1 className="font-display text-3xl font-semibold text-ink leading-tight">
              Your goals<span className="text-sage">.</span>
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
            New goal
          </motion.button>
        </motion.div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="flex flex-col gap-5">
            <div className="h-52 rounded-3xl bg-ink/6 animate-pulse" />
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
            className="flex flex-col items-center gap-4 py-16 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-mint/60 flex items-center justify-center text-2xl">
              🎯
            </div>
            <p className="text-ink font-medium">No active goals yet.</p>
            <p className="text-sm text-ink-soft/60 max-w-xs">
              Let your coach suggest goals based on your data, or create one yourself.
            </p>
            <button
              onClick={() => { setDrawerDefaultTab("suggest"); setDrawerOpen(true); }}
              className="mt-2 rounded-full bg-sage px-6 py-3 text-sm font-semibold text-cream hover:bg-sage-dark transition-colors"
            >
              Get suggestions
            </button>
          </motion.div>
        )}

        {/* ── Hero: primary (focus) goal ── */}
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

            {/* Hero card — full-width, larger treatment */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="rounded-3xl bg-mint/40 border border-mint-dark/30 shadow-sm p-6 flex flex-col gap-4"
            >
              {/* Title row */}
              <div className="flex items-start justify-between gap-3">
                <AnimatePresence mode="wait">
                  <motion.h2
                    key={primaryEntry.goal.title}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                    className="font-display text-2xl font-semibold text-ink leading-tight"
                  >
                    {primaryEntry.goal.title}
                    <span className="text-sage">.</span>
                  </motion.h2>
                </AnimatePresence>
                <span className="shrink-0 text-[10px] font-medium uppercase tracking-widest text-sage bg-sage/10 rounded-full px-2.5 py-1">
                  {primaryEntry.goal.source === "ai" ? "AI" : "Mine"}
                </span>
              </div>

              {/* Rationale */}
              {primaryEntry.goal.rationale && (
                <p className="text-sm text-ink-soft leading-relaxed -mt-1">
                  {primaryEntry.goal.rationale}
                </p>
              )}

              {/* GoalCard for the primary (shows full progress + Mistral) */}
              <div className="-mx-1">
                <GoalCard
                  key={primaryEntry.goal.id}
                  goal={primaryEntry.goal}
                  initialPercentComplete={primaryEntry.progress.percentComplete}
                  initialStatus={primaryEntry.progress.status}
                  delay={0.25}
                  onArchive={handleArchive}
                  compact
                />
              </div>

              {/* Commit buttons */}
              <div className="flex gap-2 pt-1">
                {!committed ? (
                  <>
                    <button
                      onClick={() => setCommitted(true)}
                      className="rounded-full bg-sage px-6 py-2.5 text-sm font-semibold text-cream hover:bg-sage-dark transition-colors"
                    >
                      I&apos;m in ✓
                    </button>
                    <button
                      onClick={() => { setDrawerDefaultTab("suggest"); setDrawerOpen(true); }}
                      className="rounded-full border border-ink/10 bg-white/60 px-6 py-2.5 text-sm font-medium text-ink-soft hover:border-ink/20 hover:text-ink transition-colors"
                    >
                      Pick another
                    </button>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-full bg-white/60 border border-sage/30 px-6 py-2.5 text-sm font-semibold text-sage"
                  >
                    Committed ✓
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Other active goals ── */}
        {!loading && otherEntries.length > 0 && (
          <div className="flex flex-col gap-4">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/40"
            >
              Active goals
            </motion.p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {otherEntries.map(({ goal, progress }, i) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  initialPercentComplete={progress.percentComplete}
                  initialStatus={progress.status}
                  delay={0.4 + i * 0.07}
                  onArchive={handleArchive}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── No focus goal, but has others — nudge to set one ── */}
        {!loading && !primaryEntry && otherEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-dashed border-sage/30 p-5 flex items-center justify-between gap-4"
          >
            <p className="text-sm text-ink-soft/70">
              Pin a focus goal so your coach can build your daily briefing around it.
            </p>
            <button
              onClick={() => { setDrawerDefaultTab("suggest"); setDrawerOpen(true); }}
              className="shrink-0 text-sm font-medium text-sage hover:underline"
            >
              Set focus →
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
