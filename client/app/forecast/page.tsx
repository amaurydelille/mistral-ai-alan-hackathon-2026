"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";
import PageShell from "@/components/PageShell";
import ForecastBadge from "@/components/ForecastBadge";
import ForecastChart from "@/components/ForecastChart";
import type { ForecastResponse, ForecastInsight } from "@/lib/types";

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------

function Skeleton({ className }: { className?: string }) {
  return (
    <motion.div
      className={clsx("rounded-2xl bg-ink/5", className)}
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

function ForecastSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-10 w-64" />
      </div>
      {/* Cards first — same hierarchy as real layout */}
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-56 rounded-3xl" />
      </div>
      <Skeleton className="h-44 w-full rounded-3xl" />
      <Skeleton className="h-40 w-full rounded-3xl" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Insight card
// ---------------------------------------------------------------------------

function InsightCard({ insight, delay }: { insight: ForecastInsight; delay: number }) {
  const colors = {
    alert: { border: "border-coral/20", bg: "bg-coral-light", dot: "bg-coral", value: "text-coral", text: "text-ink" },
    warn:  { border: "border-amber/20", bg: "bg-amber-light", dot: "bg-amber", value: "text-amber", text: "text-ink" },
    ok:    { border: "border-mint-dark/30", bg: "bg-mint",    dot: "bg-sage",  value: "text-sage",  text: "text-ink" },
  }[insight.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={clsx("rounded-2xl border px-5 py-4 flex gap-4", colors.bg, colors.border)}
    >
      <div className={clsx("w-2 h-2 rounded-full mt-1.5 shrink-0", colors.dot)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <p className="text-sm font-semibold text-ink">{insight.title}</p>
          <span className={clsx("text-xs font-mono font-semibold shrink-0", colors.value)}>
            {insight.value}
          </span>
        </div>
        <p className="text-xs text-ink leading-relaxed">{insight.description}</p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Signal chip
// ---------------------------------------------------------------------------

function SignalChip({
  label,
  value,
  unit = "",
  level,
  delay = 0,
}: {
  label: string;
  value: string | number;
  unit?: string;
  level: "ok" | "warn" | "alert";
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={clsx(
        "rounded-2xl border px-4 py-3 flex flex-col gap-1",
        level === "alert" ? "bg-coral-light border-coral/20 text-coral"
        : level === "warn" ? "bg-amber-light border-amber/20 text-amber"
        : "bg-mint border-mint-dark/30 text-sage"
      )}
    >
      <span className="text-[10px] font-medium uppercase tracking-widest opacity-60">{label}</span>
      <div className="flex items-baseline gap-0.5">
        <span className="text-xl font-mono font-semibold tabular-nums leading-none">{value}</span>
        {unit && <span className="text-xs opacity-50">{unit}</span>}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Data source badge
// ---------------------------------------------------------------------------

function LiveBadge({ source }: { source: "thryve-ml" | "biometric-proxy" }) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.1 }}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border",
        source === "thryve-ml"
          ? "bg-mint border-mint-dark/40 text-sage"
          : "bg-amber-light border-amber/20 text-amber"
      )}
    >
      <span className={clsx(
        "w-1.5 h-1.5 rounded-full",
        source === "thryve-ml" ? "bg-sage animate-pulse" : "bg-amber"
      )} />
      {source === "thryve-ml" ? "Live · Thryve ML + Mistral" : "Live · Biometric signals + Mistral"}
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function ForecastPage() {
  const [data, setData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/forecast")
      .then((r) => r.json())
      .then((json: ForecastResponse & { error?: string }) => {
        if (json.error) setError(json.error);
        else setData(json);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Fetch failed"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <PageShell><ForecastSkeleton /></PageShell>;

  if (error || !data) {
    return (
      <PageShell>
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <p className="text-ink-soft text-sm">{error ?? "No data available."}</p>
        </div>
      </PageShell>
    );
  }

  const { forecast, rescuePlan, computed } = data;
  const { currentScores, sleepDebtMin, historicalComposites, historicalDates, dataSource, insights = [] } = computed;
  const projectedComposites = forecast.map((d) => 100 - (d.composite ?? 50));
  const wellnessHistorical = historicalComposites.map((c) => 100 - c);

  const highestRisk = forecast.reduce((a, b) => {
    const order = { low: 0, moderate: 1, high: 2 };
    return order[b.risk] > order[a.risk] ? b : a;
  });

  const sleepDebtH = Math.floor(sleepDebtMin / 60);
  const sleepDebtM = sleepDebtMin % 60;

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8"
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-ink-soft/50 mb-2">
              Predictive health
            </p>
            <h1 className="font-display text-4xl font-semibold text-ink">
              3-day forecast<span className="text-sage">.</span>
            </h1>
          </div>
          <LiveBadge source={dataSource} />
        </motion.div>

        {/* ── FORECAST CARDS — primary content ───────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {forecast.map((day, i) => (
            <ForecastBadge
              key={day.date + day.label}
              label={day.label}
              date={day.date}
              risk={day.risk}
              reason={day.reason}
              composite={day.composite}
              delay={i * 0.1}
            />
          ))}
        </div>

        {/* ── Insights — what's driving the forecast ──────────────────── */}
        {insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <p className="text-[10px] font-medium uppercase tracking-widest text-ink-soft/40 mb-3">
              What your body is telling you
            </p>
            <div className="flex flex-col gap-3">
              {insights.map((ins, i) => (
                <InsightCard key={ins.id} insight={ins} delay={0.32 + i * 0.06} />
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Rescue plan — immediately below insights ────────────────── */}
        {rescuePlan.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="rounded-3xl bg-white/80 border border-mint-dark/30 shadow-sm p-6 mb-8"
          >
            <div className="flex items-center gap-2 mb-5">
              <div className="w-2 h-2 rounded-full bg-sage" />
              <h2 className="text-xs font-medium uppercase tracking-widest text-sage">
                {highestRisk.label} rescue plan
              </h2>
              <span className={clsx(
                "ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                highestRisk.risk === "high" ? "bg-coral-light text-coral" : "bg-amber-light text-amber"
              )}>
                {highestRisk.composite}/100
              </span>
            </div>
            <div className="flex flex-col gap-5">
              {rescuePlan.map((item, i) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.07, duration: 0.3 }}
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

        {/* ── Signal strip — supporting context ───────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mb-3"
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
              delay={0.52}
            />
            <SignalChip
              label="Sleep score"
              value={100 - currentScores.insomniaRisk}
              unit="/100"
              level={currentScores.insomniaRisk >= 65 ? "alert" : currentScores.insomniaRisk >= 40 ? "warn" : "ok"}
              delay={0.56}
            />
            <SignalChip
              label="Mental score"
              value={100 - currentScores.mentalHealthRisk}
              unit="/100"
              level={currentScores.mentalHealthRisk >= 65 ? "alert" : currentScores.mentalHealthRisk >= 40 ? "warn" : "ok"}
              delay={0.6}
            />
            <SignalChip
              label="Sleep debt (7d)"
              value={`${sleepDebtH}h ${String(sleepDebtM).padStart(2, "0")}m`}
              level={sleepDebtMin > 300 ? "alert" : sleepDebtMin > 120 ? "warn" : "ok"}
              delay={0.64}
            />
          </div>
        </motion.div>

        {/* ── Trend chart — for the data-curious ──────────────────────── */}
        <AnimatePresence>
          {historicalComposites.length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="rounded-3xl bg-white/80 border border-mint-dark/30 shadow-sm p-6 mt-6 mb-6"
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

        {/* ── Methodology footnote ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="rounded-2xl bg-surface/60 border border-ink/5 px-5 py-4"
        >
          <p className="text-[11px] text-ink-soft/50 leading-relaxed">
            <span className="font-semibold text-ink-soft/70">How this works —</span>{" "}
            Thryve&#39;s ML models compute daily sick-leave, insomnia, and mental-health risk scores from
            your wearable data. Outliers are Winsorised before EWMA smoothing (α=0.3) removes day-to-day
            noise. The projection adds a bias from sleep debt, consecutive short nights, and RHR elevation —
            signals that pure trend extrapolation misses.
            {dataSource === "biometric-proxy" && " Thryve prediction scores unavailable — biometric proxy used."}
          </p>
        </motion.div>

      </div>
    </PageShell>
  );
}
