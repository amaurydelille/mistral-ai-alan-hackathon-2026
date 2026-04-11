"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DEMO_ALL_DAYS, DEMO_START_IDX, DEMO_END_IDX, DEMO_COOKIE } from "@/lib/demo-time";

function formatDemoDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getDayLabel(idx: number): string {
  const day = DEMO_ALL_DAYS[idx];
  if (!day) return "";
  const stress = day.selfReported.stress;
  if (stress <= 2) return "good";
  if (stress <= 3) return "building";
  if (stress <= 4) return "spiral";
  return "peak";
}

const PHASE_COLORS: Record<string, string> = {
  good:     "text-sage",
  building: "text-amber-600",
  spiral:   "text-coral",
  peak:     "text-coral",
};

export default function DemoTimeControl() {
  const [demoIdx, setDemoIdx] = useState<number | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Read cookie on mount
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${DEMO_COOKIE}=([^;]*)`));
    const val = match ? parseInt(match[1], 10) : null;
    if (val !== null && !isNaN(val)) {
      setDemoIdx(Math.min(Math.max(val, DEMO_START_IDX), DEMO_END_IDX));
    }
    // If no cookie, demo mode is off — don't show control
  }, []);

  function setIndex(next: number) {
    const clamped = Math.min(Math.max(next, DEMO_START_IDX), DEMO_END_IDX);
    document.cookie = `${DEMO_COOKIE}=${clamped};path=/;max-age=86400`;
    setDemoIdx(clamped);
    // Reload so all server routes pick up the new cookie
    window.location.reload();
  }

  function startDemo() {
    setIndex(DEMO_START_IDX);
  }

  function exitDemo() {
    document.cookie = `${DEMO_COOKIE}=;path=/;max-age=0`;
    setDemoIdx(null);
    window.location.reload();
  }

  const inDemoMode = demoIdx !== null;
  const currentDay = inDemoMode ? DEMO_ALL_DAYS[demoIdx] : null;
  const position = inDemoMode ? demoIdx - DEMO_START_IDX + 1 : 0;
  const total = DEMO_END_IDX - DEMO_START_IDX + 1;
  const phase = inDemoMode ? getDayLabel(demoIdx) : "";
  const phaseColor = PHASE_COLORS[phase] ?? "text-ink-soft";

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        {inDemoMode && currentDay ? (
          /* ── Active demo controls ── */
          <div className="flex items-center gap-3 rounded-2xl bg-ink/90 backdrop-blur-sm border border-white/10 shadow-2xl px-4 py-2.5">
            {/* Prev */}
            <button
              onClick={() => setIndex(demoIdx - 1)}
              disabled={demoIdx <= DEMO_START_IDX}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              title="Previous day"
            >
              ←
            </button>

            {/* Date + phase */}
            <div className="flex flex-col items-center min-w-[90px]">
              <span className="text-[10px] font-medium uppercase tracking-widest text-white/40 leading-none mb-0.5">
                Demo · day {position}/{total}
              </span>
              <span className="text-sm font-semibold text-white leading-none">
                {formatDemoDate(currentDay.date)}
              </span>
              <span className={`text-[10px] font-medium mt-0.5 leading-none ${phaseColor}`}>
                {phase} phase
              </span>
            </div>

            {/* Progress pips */}
            <div className="flex gap-1">
              {Array.from({ length: total }).map((_, i) => {
                const absIdx = DEMO_START_IDX + i;
                const dayPhase = getDayLabel(absIdx);
                const pipColor =
                  dayPhase === "good" ? "bg-sage" :
                  dayPhase === "building" ? "bg-amber-400" : "bg-coral";
                return (
                  <button
                    key={i}
                    onClick={() => setIndex(absIdx)}
                    title={formatDemoDate(DEMO_ALL_DAYS[absIdx].date)}
                    className={`h-1.5 rounded-full transition-all ${
                      absIdx === demoIdx
                        ? `w-4 ${pipColor} opacity-100`
                        : `w-1.5 ${pipColor} opacity-30 hover:opacity-60`
                    }`}
                  />
                );
              })}
            </div>

            {/* Next */}
            <button
              onClick={() => setIndex(demoIdx + 1)}
              disabled={demoIdx >= DEMO_END_IDX}
              className="w-7 h-7 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              title="Next day"
            >
              →
            </button>

            {/* Exit */}
            <div className="w-px h-4 bg-white/10" />
            <button
              onClick={exitDemo}
              className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
              title="Exit demo mode"
            >
              ✕
            </button>
          </div>
        ) : (
          /* ── Start demo button ── */
          <div className="flex items-center rounded-2xl bg-ink/80 backdrop-blur-sm border border-white/10 shadow-xl overflow-hidden">
            <button
              onClick={startDemo}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <span className="text-[10px] font-medium uppercase tracking-widest text-sage">▶</span>
              Start demo
            </button>
            <button
              onClick={() => setVisible(false)}
              className="px-2 py-2.5 text-white/30 hover:text-white/60 text-[10px] transition-colors border-l border-white/10"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
