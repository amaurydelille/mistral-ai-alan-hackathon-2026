"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import CoachMessage from "@/components/CoachMessage";
import type { OnboardingResult } from "@/app/api/onboarding/route";

const OPENING =
  "Hi Amaury. I'm Vital, your AI health coach. I've connected your wearable — the data is already loaded. One question before I show you: what's your main focus right now?";

const STORAGE_KEY = "vital_onboarding_v1";

interface PersistedOnboarding {
  userMessage: string;
  coachReply: string;
  profile: Record<string, unknown>;
}

type Phase = "intro" | "loading" | "done";

// Pretty-print a profile field value
function formatValue(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ");
  if (typeof v === "boolean") return v ? "yes" : "no";
  return String(v);
}

// Fields to show in the panel (in order), with display labels
const FIELD_LABELS: Record<string, string> = {
  main_focus:     "main_focus",
  goals:          "goals",
  sleep_concern:  "sleep_concern",
  energy_concern: "energy_concern",
  stress_level:   "stress_level",
  constraints:    "constraints",
  caffeine:       "caffeine",
  alcohol:        "alcohol",
  key_insight:    "key_insight",
};

export default function OnboardingPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("intro");
  const [userMessage, setUserMessage] = useState("");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<OnboardingResult | null>(null);
  const [visibleFields, setVisibleFields] = useState<string[]>([]);
  const [coachReply, setCoachReply] = useState("");
  const [restored, setRestored] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore completed state from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const persisted = JSON.parse(saved) as PersistedOnboarding;
      setUserMessage(persisted.userMessage);
      setCoachReply(persisted.coachReply);
      setResult({ profile: persisted.profile, coachReply: persisted.coachReply });
      // Show all fields immediately — no stagger animation on restore
      const fields = Object.keys(persisted.profile).filter((k) => k in FIELD_LABELS);
      setVisibleFields(fields);
      setPhase("done");
      setRestored(true);
    } catch {
      // corrupted storage — ignore and start fresh
    }
  }, []);

  // Focus input only on fresh start
  useEffect(() => {
    if (phase === "intro") inputRef.current?.focus();
  }, [phase]);

  const handleSubmit = async () => {
    const trimmed = input.trim();
    if (!trimmed || phase !== "intro") return;

    setUserMessage(trimmed);
    setInput("");
    setPhase("loading");

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const data = (await res.json()) as OnboardingResult;
      setResult(data);
      setCoachReply(data.coachReply);
      setPhase("done");

      // Persist so navigating away and back skips the input
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          userMessage: trimmed,
          coachReply: data.coachReply,
          profile: data.profile,
        } satisfies PersistedOnboarding));
      } catch { /* storage full — not critical */ }

      // Stagger fields into the panel
      const fields = Object.keys(data.profile).filter((k) => k in FIELD_LABELS);
      fields.forEach((key, i) => {
        setTimeout(() => {
          setVisibleFields((prev) => [...prev, key]);
        }, i * 220);
      });
    } catch {
      setCoachReply("Your data is already loaded — let me show you what's going on.");
      setPhase("done");
    }
  };

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-2 gap-12 min-h-[calc(100vh-5rem)]">

        {/* ── Left: conversation ── */}
        <div className="flex flex-col justify-between">
          <div>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-display text-4xl font-semibold text-ink mb-2"
            >
              One question.
            </motion.h1>
            <p className="text-ink-soft mb-8">
              Then I&apos;ll show you exactly what your data says.
            </p>

            {/* Messages */}
            <div className="flex flex-col gap-4">
              {/* Opening coach message */}
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <CoachMessage text={OPENING} from="coach" typewriter speed={14} />
              </motion.div>

              {/* User reply */}
              <AnimatePresence>
                {userMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <CoachMessage text={userMessage} from="user" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading dots */}
              <AnimatePresence>
                {phase === "loading" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-full bg-sage flex items-center justify-center text-cream text-xs font-semibold font-display shrink-0">
                      V
                    </div>
                    <div className="rounded-2xl rounded-tl-sm bg-white/90 border border-mint-dark/30 px-4 py-3">
                      <div className="flex gap-1 items-center h-4">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-sage/50"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.5, delay: i * 0.12, repeat: Infinity }}
                          />
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Coach reply after extraction */}
              <AnimatePresence>
                {phase === "done" && coachReply && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  >
                    <CoachMessage text={coachReply} from="coach" typewriter={!restored} speed={14} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="mt-8">
            <AnimatePresence mode="wait">
              {phase === "intro" ? (
                <motion.div
                  key="input"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex gap-2"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
                    placeholder="e.g. Sleep better and have more energy at work…"
                    className="flex-1 rounded-2xl border border-mint-dark/40 bg-white/80 px-4 py-3 text-sm text-ink placeholder:text-ink-soft/40 focus:outline-none focus:border-sage focus:ring-1 focus:ring-sage/20 transition-colors"
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!input.trim()}
                    className="rounded-2xl bg-sage px-5 py-3 text-sm font-medium text-cream hover:bg-sage-dark transition-colors disabled:opacity-40"
                  >
                    Send
                  </button>
                </motion.div>
              ) : phase === "done" ? (
                <motion.button
                  key="cta"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  onClick={() => router.push("/overview")}
                  className="rounded-full bg-sage px-8 py-3 text-sm font-semibold text-cream hover:bg-sage-dark transition-colors shadow-lg shadow-sage/25"
                >
                  Show me my data →
                </motion.button>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right: live profile extraction panel ── */}
        <div className="hidden lg:flex flex-col justify-center">
          <div className="rounded-3xl border border-mint-dark/40 bg-white/60 p-6 min-h-[220px]">
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-2 h-2 rounded-full ${phase === "loading" ? "bg-amber animate-pulse" : phase === "done" ? "bg-sage animate-pulse" : "bg-ink/20"}`} />
              <span className="text-xs font-medium uppercase tracking-widest text-sage">
                Profile extraction · Mistral
              </span>
            </div>

            <pre className="font-mono text-xs text-ink-soft leading-loose overflow-hidden">
              <span className="text-ink-soft/40">{"{"}</span>
              {"\n"}

              {phase === "loading" && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.3, 0.7, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  className="block ml-2 text-ink-soft/30"
                >
                  {"// analysing..."}
                </motion.span>
              )}

              <AnimatePresence>
                {result && visibleFields.map((key) => {
                  const value = result.profile[key];
                  if (value === undefined) return null;
                  return (
                    <motion.span
                      key={key}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className="block"
                    >
                      {"  "}
                      <span className="text-sage">&quot;{FIELD_LABELS[key] ?? key}&quot;</span>
                      <span className="text-ink-soft/40">: </span>
                      <span className="text-ink">{JSON.stringify(formatValue(value))}</span>
                      <span className="text-ink-soft/40">,</span>
                    </motion.span>
                  );
                })}
              </AnimatePresence>

              {phase === "intro" && (
                <span className="ml-2 text-ink-soft/30">{"// waiting for input..."}</span>
              )}

              {"\n"}
              <span className="text-ink-soft/40">{"}"}</span>
            </pre>
          </div>

          <p className="mt-4 text-xs text-ink-soft/50 text-center">
            Mistral extracts structured data from natural language in real-time
          </p>
        </div>

      </div>
    </PageShell>
  );
}
