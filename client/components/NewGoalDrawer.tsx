"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";
import type { Goal, GoalMetric, GoalTimeframe } from "@/lib/types";
import { METRIC_META } from "@/lib/goals";
import type { GoalSuggestion } from "@/app/api/goals/suggest/route";

interface NewGoalDrawerProps {
  open: boolean;
  defaultTab?: "suggest" | "manual";
  onClose: () => void;
  onCreated: (goal: Goal) => void;
  existingGoalTitles?: string[];
  prefillAbstract?: { title: string; description?: string };
}

const METRIC_LIST = (Object.entries(METRIC_META) as [GoalMetric, typeof METRIC_META[GoalMetric]][])
  .filter(([key]) => key !== "abstract");

export default function NewGoalDrawer({ open, defaultTab = "suggest", onClose, onCreated, existingGoalTitles, prefillAbstract }: NewGoalDrawerProps) {
  const [tab, setTab] = useState<"suggest" | "manual">(defaultTab);
  const [suggestions, setSuggestions] = useState<GoalSuggestion[] | null>(null);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Manual form state
  const [manualType, setManualType] = useState<"metric" | "abstract">("metric");
  const [metric, setMetric] = useState<GoalMetric>("sleep_duration_min");
  const [timeframe, setTimeframe] = useState<GoalTimeframe>("7d");
  const [target, setTarget] = useState<string>("");
  // Behavioral goal state
  const [behavTitle, setBehavTitle] = useState("");
  const [behavDesc, setBehavDesc] = useState("");

  function doFetchSuggestions(existing: string[]) {
    setLoadingSuggest(true);
    setSuggestions(null);
    const url = existing.length
      ? `/api/goals/suggest?existing=${encodeURIComponent(existing.join("|"))}`
      : "/api/goals/suggest";
    fetch(url)
      .then((r) => r.json())
      .then((d: GoalSuggestion[]) => { setSuggestions(d); setLoadingSuggest(false); })
      .catch(() => setLoadingSuggest(false));
  }

  // Auto-fetch suggestions and reset tab state whenever the drawer opens
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    setTab(defaultTab);
    setCreateError(null);
    if (prefillAbstract) {
      setManualType("abstract");
      setBehavTitle(prefillAbstract.title);
      setBehavDesc(prefillAbstract.description ?? "");
    } else {
      setBehavTitle("");
      setBehavDesc("");
    }
    if (defaultTab === "suggest") {
      doFetchSuggestions(existingGoalTitles ?? []);
    } else {
      setSuggestions(null);
    }
  }, [open]);

  function openSuggestTab() {
    setTab("suggest");
    if (!suggestions && !loadingSuggest) {
      doFetchSuggestions(existingGoalTitles ?? []);
    }
  }

  async function createFromSuggestion(s: GoalSuggestion, isPrimary = false) {
    setCreating(true);
    setCreateError(null);
    try {
      const body = s.goalType === "abstract"
        ? { goalType: "abstract", title: s.title, description: s.description, timeframe: s.timeframe, rationale: s.rationale, source: "ai", isPrimary }
        : { ...s, source: "ai", isPrimary };
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const goal: Goal = await res.json();
      onCreated(goal);
      onClose();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not save goal");
    } finally {
      setCreating(false);
    }
  }

  async function createManual(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      let body: Record<string, unknown>;
      if (manualType === "abstract") {
        if (!behavTitle.trim()) throw new Error("Please enter a goal title");
        body = {
          goalType: "abstract",
          title: behavTitle.trim(),
          description: behavDesc.trim() || behavTitle.trim(),
          timeframe: "1d",
          source: "user",
          isPrimary: false,
        };
      } else {
        const meta = METRIC_META[metric];
        const numTarget = parseFloat(target) || meta.defaultTarget;
        body = {
          title: `${meta.comparator === "gte" ? "Hit" : "Keep"} ${meta.label.toLowerCase()} ${meta.comparator === "gte" ? "≥" : "≤"} ${numTarget} ${meta.unit}`,
          metric,
          comparator: meta.comparator,
          target: numTarget,
          unit: meta.unit,
          timeframe,
          source: "user",
          isPrimary: false,
        };
      }
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const goal: Goal = await res.json();
      onCreated(goal);
      onClose();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not save goal");
    } finally {
      setCreating(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setCreateError(null); onClose(); }}
            className="fixed inset-0 z-40 bg-ink/20 backdrop-blur-[2px]"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-xl rounded-t-3xl bg-cream border-t border-mint-dark/30 shadow-2xl p-6 pb-10"
          >
            <div className="w-10 h-1 bg-ink/20 rounded-full mx-auto mb-5" />

            <h2 className="font-display text-xl font-semibold text-ink mb-4">
              New goal<span className="text-sage">.</span>
            </h2>

            {/* Error */}
            {createError && (
              <p className="mb-3 rounded-xl bg-coral/10 px-3 py-2 text-xs text-coral font-medium">
                {createError}
              </p>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-mint/40 rounded-2xl p-1 mb-5">
              {(["suggest", "manual"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => t === "suggest" ? openSuggestTab() : setTab("manual")}
                  className={clsx(
                    "flex-1 rounded-xl py-2 text-sm font-medium transition-all duration-200",
                    tab === t ? "bg-white shadow-sm text-ink" : "text-ink-soft hover:text-ink"
                  )}
                >
                  {t === "suggest" ? "Let coach suggest" : "Choose your own"}
                </button>
              ))}
            </div>

            {/* Suggest tab */}
            {tab === "suggest" && (
              <div className="flex flex-col gap-3">
                {loadingSuggest ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 bg-ink/6 rounded-2xl animate-pulse" />
                  ))
                ) : suggestions ? (
                  suggestions.map((s, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      onClick={() => createFromSuggestion(s)}
                      disabled={creating}
                      className="text-left rounded-2xl border border-mint-dark/30 bg-white/80 p-4 hover:border-sage/50 hover:bg-sage/5 transition-all disabled:opacity-50"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-ink">{s.title}</p>
                        {s.goalType === "abstract" && (
                          <span className="shrink-0 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest">
                            behavioral
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-soft/70 leading-relaxed">{s.rationale}</p>
                      <p className="text-[10px] text-sage font-medium mt-1.5 uppercase tracking-widest">
                        {s.goalType === "abstract" ? "daily" : s.timeframe === "1d" ? "1-day" : "7-day"} goal · tap to add
                      </p>
                    </motion.button>
                  ))
                ) : (
                  <p className="text-sm text-ink-soft/60 text-center py-4">No suggestions yet</p>
                )}
              </div>
            )}

            {/* Manual tab */}
            {tab === "manual" && (
              <form onSubmit={createManual} className="flex flex-col gap-4">
                {/* Goal type toggle */}
                <div className="flex gap-1 bg-mint/40 rounded-2xl p-1">
                  {(["metric", "abstract"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setManualType(t)}
                      className={clsx(
                        "flex-1 rounded-xl py-2 text-sm font-medium transition-all duration-200",
                        manualType === t ? "bg-white shadow-sm text-ink" : "text-ink-soft hover:text-ink"
                      )}
                    >
                      {t === "metric" ? "Metric goal" : "Behavioral goal"}
                    </button>
                  ))}
                </div>

                {manualType === "metric" ? (
                  <>
                    {/* Metric */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium uppercase tracking-widest text-ink-soft/60">Metric</label>
                      <select
                        value={metric}
                        onChange={(e) => { setMetric(e.target.value as GoalMetric); setTarget(""); }}
                        className="rounded-xl border border-mint-dark/30 bg-white/80 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage/30"
                      >
                        {METRIC_LIST.map(([key, meta]) => (
                          <option key={key} value={key}>{meta.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Target */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium uppercase tracking-widest text-ink-soft/60">
                        Target ({METRIC_META[metric].comparator === "gte" ? "at least" : "no more than"})
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={target}
                          onChange={(e) => setTarget(e.target.value)}
                          placeholder={String(METRIC_META[metric].defaultTarget)}
                          className="flex-1 rounded-xl border border-mint-dark/30 bg-white/80 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage/30"
                        />
                        <span className="text-sm text-ink-soft font-mono pr-1">{METRIC_META[metric].unit}</span>
                      </div>
                    </div>

                    {/* Timeframe */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium uppercase tracking-widest text-ink-soft/60">Timeframe</label>
                      <div className="flex gap-2">
                        {(["1d", "7d"] as const).map((tf) => (
                          <button
                            key={tf}
                            type="button"
                            onClick={() => setTimeframe(tf)}
                            className={clsx(
                              "flex-1 rounded-xl py-2.5 text-sm font-medium border transition-all",
                              timeframe === tf
                                ? "bg-sage text-cream border-sage"
                                : "bg-white/80 text-ink-soft border-mint-dark/30 hover:border-sage/40 hover:text-ink"
                            )}
                          >
                            {tf === "1d" ? "Today (1d)" : "7-day average"}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Behavioral goal */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium uppercase tracking-widest text-ink-soft/60">
                        Commitment
                      </label>
                      <input
                        type="text"
                        value={behavTitle}
                        onChange={(e) => setBehavTitle(e.target.value)}
                        placeholder="e.g. No caffeine after 4pm"
                        className="rounded-xl border border-mint-dark/30 bg-white/80 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage/30"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium uppercase tracking-widest text-ink-soft/60">
                        Details <span className="opacity-40">(optional)</span>
                      </label>
                      <textarea
                        value={behavDesc}
                        onChange={(e) => setBehavDesc(e.target.value)}
                        placeholder="Any context to help the coach evaluate this..."
                        rows={2}
                        className="rounded-xl border border-mint-dark/30 bg-white/80 px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-sage/30 resize-none"
                      />
                    </div>
                    <p className="text-[11px] text-ink-soft/50 -mt-1">
                      The coach will check your self-reported data each day to evaluate this commitment.
                    </p>
                  </>
                )}

                <button
                  type="submit"
                  disabled={creating}
                  className="w-full rounded-full bg-sage py-3 text-sm font-semibold text-cream hover:bg-sage-dark transition-colors disabled:opacity-60 shadow-lg shadow-sage/20"
                >
                  {creating ? "Adding…" : "Add goal"}
                </button>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
