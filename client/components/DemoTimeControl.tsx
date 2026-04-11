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
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.6, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="fixed right-2 top-1/2 -translate-y-1/2 z-50 w-[4.75rem]"
      >
        {inDemoMode && currentDay ? (
          /* ── Active demo controls ── */
          <div className="flex flex-col items-center gap-1 rounded-lg bg-ink/90 backdrop-blur-sm border border-white/10 shadow-lg px-1.5 py-1.5">
            {/* Date + phase */}
            <div className="flex flex-col items-center min-w-0 text-center w-full">
              <span className="text-[8px] font-medium uppercase tracking-wide text-white/40 leading-none">
                {position}/{total}
              </span>
              <span className="text-[10px] font-semibold text-white leading-tight mt-0.5">
                {formatDemoDate(currentDay.date)}
              </span>
              <span className={`text-[8px] font-medium mt-px leading-none ${phaseColor}`}>
                {phase}
              </span>
            </div>

            {/* Prev / Next */}
            <div className="flex items-center justify-center gap-0.5">
              <button
                onClick={() => setIndex(demoIdx - 1)}
                disabled={demoIdx <= DEMO_START_IDX}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white/55 hover:text-white hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                title="Previous day"
              >
                ←
              </button>
              <button
                onClick={() => setIndex(demoIdx + 1)}
                disabled={demoIdx >= DEMO_END_IDX}
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white/55 hover:text-white hover:bg-white/10 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                title="Next day"
              >
                →
              </button>
            </div>

            {/* Progress pips */}
            <div className="flex flex-wrap justify-center gap-px max-w-full px-0.5">
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
                    className={`h-1 rounded-full transition-all ${
                      absIdx === demoIdx
                        ? `w-2.5 ${pipColor} opacity-100`
                        : `w-1 ${pipColor} opacity-30 hover:opacity-60`
                    }`}
                  />
                );
              })}
            </div>

            <div className="w-full h-px bg-white/10" />
            <button
              onClick={exitDemo}
              className="text-[8px] leading-none py-0.5 text-white/35 hover:text-white/55 transition-colors"
              title="Exit demo mode"
            >
              ✕
            </button>
          </div>
        ) : (
          /* ── Start demo button ── */
          <div className="flex flex-col rounded-lg bg-ink/80 backdrop-blur-sm border border-white/10 shadow-lg overflow-hidden">
            <button
              onClick={startDemo}
              className="flex flex-col items-center gap-0 px-1.5 py-1 text-[9px] font-medium text-white/55 hover:text-white hover:bg-white/5 transition-all leading-tight"
            >
              <span className="text-[8px] text-sage">▶</span>
              <span className="uppercase tracking-wide">Demo</span>
            </button>
            <button
              onClick={() => setVisible(false)}
              className="py-0.5 text-white/30 hover:text-white/55 text-[8px] transition-colors border-t border-white/10"
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
