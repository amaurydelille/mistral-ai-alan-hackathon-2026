"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import PageShell from "@/components/PageShell";
import { oneThingToday } from "@/lib/coach-copy";

const ALTERNATES = [
  { action: "10-min walk after lunch", why: "Even a brief activity burst lowers afternoon cortisol — and your sedentary hours are at 13h today." },
  { action: "Lights out by 23:00", why: "You've gone to bed after 1am 6 nights in a row. Tonight, just 23:00. One night changes the momentum." },
  { action: "No screens after 22:30", why: "Screen light suppresses melatonin by 50%. On the 3 nights you did this, you fell asleep 22 minutes faster." },
];

export default function OneThingPage() {
  const [committed, setCommitted] = useState(false);
  const [alternateIdx, setAlternateIdx] = useState<number | null>(null);

  const current = alternateIdx !== null ? ALTERNATES[alternateIdx] : oneThingToday;

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col items-center text-center min-h-[calc(100vh-5rem)] justify-center gap-10">

        {/* Yesterday's win */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full rounded-2xl bg-mint/60 border border-mint-dark/40 px-6 py-4 text-left"
        >
          <p className="text-xs font-medium uppercase tracking-widest text-sage mb-2">
            Yesterday&apos;s commitment
          </p>
          <p className="text-sm text-ink font-medium mb-1">
            &ldquo;{oneThingToday.yesterday.commitment}&rdquo;
          </p>
          <p className="text-sm text-ink-soft">
            Result:{" "}
            <span className="text-sage font-medium">
              {oneThingToday.yesterday.result}
            </span>
          </p>
        </motion.div>

        {/* The one thing */}
        <div className="flex flex-col items-center gap-4">
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs font-medium uppercase tracking-widest text-ink-soft/50"
          >
            Today&apos;s one thing
          </motion.p>

          <AnimatePresence mode="wait">
            <motion.h1
              key={current.action}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3 }}
              className="font-display text-5xl md:text-6xl font-semibold text-ink leading-tight"
            >
              {current.action}
              <span className="text-sage">.</span>
            </motion.h1>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.p
              key={current.why}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-ink-soft max-w-md leading-relaxed"
            >
              {current.why}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Commitment buttons */}
        <div className="flex gap-3">
          {!committed ? (
            <>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                onClick={() => setCommitted(true)}
                className="rounded-full bg-sage px-8 py-3.5 text-sm font-semibold text-cream hover:bg-sage-dark transition-colors shadow-lg shadow-sage/20"
              >
                I&apos;m in ✓
              </motion.button>
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                onClick={() =>
                  setAlternateIdx((i) =>
                    i === null ? 0 : Math.min(i + 1, ALTERNATES.length - 1)
                  )
                }
                disabled={alternateIdx !== null && alternateIdx >= ALTERNATES.length - 1}
                className="rounded-full border border-ink/10 bg-white/60 px-8 py-3.5 text-sm font-medium text-ink-soft hover:border-ink/20 hover:text-ink transition-colors disabled:opacity-30"
              >
                Pick another
              </motion.button>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-full bg-mint border border-mint-dark/40 px-8 py-3.5 text-sm font-semibold text-sage"
            >
              Committed — I&apos;ll check in tomorrow ✓
            </motion.div>
          )}
        </div>

        <p className="text-xs text-ink-soft/40">
          Based on your data, this is your highest-leverage action today.
        </p>
      </div>
    </PageShell>
  );
}
