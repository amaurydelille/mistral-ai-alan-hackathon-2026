"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PageShell from "@/components/PageShell";
import ChatInput from "@/components/ChatInput";
import type {
  ChatResponse,
  ConversationExchange,
  ConversationTurn,
  HistoryEntry,
} from "@/lib/what-if";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SUGGESTIONS = [
  "What if I have 3 beers tonight?",
  "What if I stay up until 1am?",
  "What if I skip my workout?",
  "What if I drink coffee at 4pm?",
  "What if I take a nap this afternoon?",
];

let _id = 0;
const uid = () => _id++;

// ---------------------------------------------------------------------------
// Markdown message bubble
// ---------------------------------------------------------------------------

function CoachBubble({ text }: { text: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-sage flex items-center justify-center text-cream text-xs font-semibold font-display shrink-0 mt-0.5">
        V
      </div>
      <div className="flex-1 min-w-0 rounded-2xl rounded-tl-sm bg-white/90 border border-mint-dark/30 px-4 py-3 shadow-sm prose-sm prose">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="text-sm text-ink leading-relaxed mb-2 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold text-ink">{children}</strong>,
            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
            li: ({ children }) => <li className="text-sm text-ink leading-relaxed">{children}</li>,
            h2: ({ children }) => <h2 className="text-sm font-semibold text-ink mt-3 mb-1 first:mt-0">{children}</h2>,
            h3: ({ children }) => <h3 className="text-xs font-semibold text-ink-soft uppercase tracking-wide mt-3 mb-1 first:mt-0">{children}</h3>,
            code: ({ children }) => <code className="font-mono text-xs bg-ink/5 px-1 py-0.5 rounded text-ink">{children}</code>,
            blockquote: ({ children }) => <blockquote className="border-l-2 border-sage/40 pl-3 my-2 text-ink/70 italic">{children}</blockquote>,
            hr: () => <hr className="border-ink/8 my-3" />,
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// User message bubble
// ---------------------------------------------------------------------------

function UserBubble({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="flex justify-end"
    >
      <div className="bg-sage text-cream rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[80%] leading-relaxed">
        {text}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Collapsed exchange — history rail
// ---------------------------------------------------------------------------

function CollapsedExchange({
  exchange,
  onExpand,
}: {
  exchange: ConversationExchange;
  onExpand: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onExpand}
      className="w-full text-left rounded-xl border border-ink/8 bg-white/50 px-4 py-2.5 flex items-center gap-3 hover:bg-white/80 hover:border-ink/15 transition-all duration-150 group"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-sage/50 shrink-0" />
      <span className="text-sm text-ink flex-1 truncate">{exchange.topic}</span>
      {exchange.turns.length > 1 && (
        <span className="text-[10px] text-ink-soft/40 font-mono shrink-0">{exchange.turns.length} turns</span>
      )}
      <span className="text-ink-soft/30 group-hover:text-ink-soft/60 text-xs shrink-0 transition-colors">expand ›</span>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      className="flex items-center gap-3"
    >
      <div className="w-7 h-7 rounded-full bg-sage flex items-center justify-center text-cream text-xs font-semibold font-display shrink-0">
        V
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-white/90 border border-mint-dark/30 px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-sage/50"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.5, delay: i * 0.12, repeat: Infinity, ease: "easeInOut" }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onSuggest }: { onSuggest: (q: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center flex-1 gap-6 py-12"
    >
      <div className="text-center">
        <p className="text-3xl mb-3">🔮</p>
        <p className="text-ink font-semibold text-lg mb-1">Test a decision</p>
        <p className="text-sm text-ink-soft/60 max-w-xs">
          Ask anything — your coach answers based on your real biometric history.
        </p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {SUGGESTIONS.slice(0, 3).map((s) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="rounded-full border border-sage/25 bg-white/70 px-4 py-2 text-sm text-ink-soft hover:bg-mint hover:border-sage/50 hover:text-ink transition-all duration-150"
          >
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function WhatIfPage() {
  const [exchanges, setExchanges] = useState<ConversationExchange[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const latestExchange = exchanges[exchanges.length - 1] ?? null;
  const activeExchange =
    expandedId !== null
      ? (exchanges.find((e) => e.id === expandedId) ?? latestExchange)
      : latestExchange;
  const historyExchanges = exchanges.filter((e) => e !== activeExchange);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [exchanges, loading]);

  const handleSubmit = async (question: string) => {
    if (loading) return;
    setLoading(true);
    setError(null);

    const recentTurns: HistoryEntry[] = exchanges
      .flatMap((ex) => ex.turns)
      .slice(-4)
      .map((t) => ({
        question: t.question,
        answer: t.response.text.slice(0, 200),
      }));

    try {
      const res = await fetch("/api/what-if", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history: recentTurns }),
      });

      const data = await res.json() as ChatResponse & { error?: string };

      if (data.error) {
        setError(data.error);
        return;
      }

      const newTurn: ConversationTurn = { id: uid(), question, response: data };
      const isFollowUp = data.isFollowUp && latestExchange !== null;

      setExchanges((prev) => {
        if (isFollowUp && prev.length > 0) {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          updated[updated.length - 1] = { ...last, turns: [...last.turns, newTurn] };
          return updated;
        }
        return [...prev, { id: uid(), topic: question, turns: [newTurn] }];
      });

      setExpandedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = exchanges.length === 0 && !loading;

  return (
    <PageShell>
      <div className="max-w-2xl mx-auto px-6 py-8 flex flex-col min-h-[calc(100vh-5rem)]">

        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-ink-soft/50 mb-2">
            Decision simulator
          </p>
          <h1 className="font-display text-4xl font-semibold text-ink">
            What if<span className="text-sage">?</span>
          </h1>
          <p className="text-sm text-ink-soft mt-1 max-w-sm">
            Test any decision against your real biometric history before you make it.
          </p>
        </motion.div>

        {/* Conversation */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto pb-4">

          {/* Collapsed history */}
          <AnimatePresence>
            {historyExchanges.map((ex) => (
              <CollapsedExchange
                key={ex.id}
                exchange={ex}
                onExpand={() => setExpandedId(ex.id === expandedId ? null : ex.id)}
              />
            ))}
          </AnimatePresence>

          {/* Expanded old exchange */}
          <AnimatePresence>
            {expandedId !== null && activeExchange && activeExchange !== latestExchange && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-4"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-soft/40">Past exchange</span>
                  <button
                    onClick={() => setExpandedId(null)}
                    className="ml-auto text-xs text-ink-soft/40 hover:text-ink-soft transition-colors"
                  >
                    close ×
                  </button>
                </div>
                {activeExchange.turns.map((turn) => (
                  <div key={turn.id} className="flex flex-col gap-3">
                    <UserBubble text={turn.question} />
                    <CoachBubble text={turn.response.text} />
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {isEmpty && <EmptyState onSuggest={handleSubmit} />}

          <AnimatePresence>
            {loading && <TypingIndicator />}
          </AnimatePresence>

          {/* Latest exchange — all turns */}
          <AnimatePresence>
            {!loading && latestExchange && activeExchange === latestExchange && (
              <motion.div
                key={latestExchange.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col gap-4"
              >
                {latestExchange.turns.map((turn, i) => (
                  <div key={turn.id} className="flex flex-col gap-3">
                    <UserBubble text={turn.question} />
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i === latestExchange.turns.length - 1 ? 0.05 : 0 }}
                    >
                      <CoachBubble text={turn.response.text} />
                    </motion.div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-coral text-center py-2"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="pt-4 border-t border-mint-dark/30">
          <ChatInput
            suggestions={
              exchanges.length > 0
                ? ["Why does this matter?", "What about just 1 drink?", "Any tips to offset this?"]
                : []
            }
            onSubmit={handleSubmit}
            placeholder={
              exchanges.length > 0
                ? "Ask a follow-up or a new question…"
                : "e.g. What if I have 3 beers tonight?"
            }
            disabled={loading}
          />
        </div>

      </div>
    </PageShell>
  );
}
