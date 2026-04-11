"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import CoachMessage from "@/components/CoachMessage";
import { onboardingScript } from "@/lib/coach-copy";

type ScriptEntry = (typeof onboardingScript)[number];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // index into onboardingScript
  const [messages, setMessages] = useState<ScriptEntry[]>([onboardingScript[0]]);
  const [typing, setTyping] = useState(false);
  const [profileFields, setProfileFields] = useState<Record<string, unknown>>({});
  const [done, setDone] = useState(false);

  const advance = () => {
    if (typing || done) return;

    const nextUserIdx = step + 1;
    const nextCoachIdx = step + 2;

    if (nextUserIdx >= onboardingScript.length) {
      setDone(true);
      return;
    }

    // Show user reply
    const userMsg = onboardingScript[nextUserIdx];
    setMessages((m) => [...m, userMsg]);

    // Then show coach reply after a small delay
    if (nextCoachIdx < onboardingScript.length) {
      setTyping(true);
      setTimeout(() => {
        const coachMsg = onboardingScript[nextCoachIdx];
        setMessages((m) => [...m, coachMsg]);
        setStep(nextCoachIdx);

        // Animate extracted profile if this message has one
        if (coachMsg.extractedProfile) {
          const profile = coachMsg.extractedProfile as Record<string, unknown>;
          let i = 0;
          const keys = Object.keys(profile);
          const interval = setInterval(() => {
            if (i < keys.length) {
              const k = keys[i];
              setProfileFields((f) => ({ ...f, [k]: profile[k] }));
              i++;
            } else {
              clearInterval(interval);
              setDone(true);
            }
          }, 280);
        } else {
          setTyping(false);
        }
      }, 600);
    } else {
      setStep(nextUserIdx);
      setDone(true);
    }
  };

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[calc(100vh-5rem)]">
        {/* Left — chat */}
        <div className="flex flex-col justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-display text-4xl font-semibold text-ink mb-2"
            >
              Let&apos;s get to know you.
            </motion.h1>
            <p className="text-ink-soft mb-8">
              2 minutes. No forms. Just a conversation.
            </p>

            {/* Messages */}
            <div className="flex flex-col gap-4 overflow-y-auto max-h-[50vh] pr-2">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <CoachMessage
                      text={msg.text}
                      from={msg.from}
                      typewriter={i === messages.length - 1 && msg.from === "coach"}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="mt-8 flex gap-3">
            {!done ? (
              <button
                onClick={advance}
                disabled={typing}
                className="rounded-full bg-sage px-6 py-3 text-sm font-medium text-cream hover:bg-sage-dark transition-colors disabled:opacity-50"
              >
                Continue →
              </button>
            ) : (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => router.push("/dashboard")}
                className="rounded-full bg-sage px-8 py-3 text-sm font-semibold text-cream hover:bg-sage-dark transition-colors shadow-lg shadow-sage/25"
              >
                Import health data →
              </motion.button>
            )}
          </div>
        </div>

        {/* Right — live JSON extraction card */}
        <div className="hidden lg:flex flex-col justify-center">
          <div className="rounded-3xl border border-mint-dark/40 bg-white/60 p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
              <span className="text-xs font-medium uppercase tracking-widest text-sage">
                Profile extraction · Mistral
              </span>
            </div>
            <pre className="font-mono text-xs text-ink-soft leading-loose overflow-hidden">
              <span className="text-ink-soft/40">{"{"}</span>
              {"\n"}
              {Object.entries(profileFields).map(([k, v]) => (
                <motion.span
                  key={k}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="block"
                >
                  {"  "}
                  <span className="text-sage">&quot;{k}&quot;</span>
                  <span className="text-ink-soft/40">: </span>
                  <span className="text-ink">
                    {JSON.stringify(v)}
                  </span>
                  <span className="text-ink-soft/40">,</span>
                </motion.span>
              ))}
              {Object.keys(profileFields).length === 0 && (
                <span className="text-ink-soft/30 ml-2">
                  {"// waiting for conversation..."}
                </span>
              )}
              {"\n"}
              <span className="text-ink-soft/40">{"}"}</span>
            </pre>
          </div>

          <p className="mt-4 text-xs text-ink-soft/50 text-center">
            LLM extracts structured data from natural language in real-time
          </p>
        </div>
      </div>
    </PageShell>
  );
}
