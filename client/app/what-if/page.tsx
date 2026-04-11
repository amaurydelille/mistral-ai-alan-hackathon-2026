"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import PageShell from "@/components/PageShell";
import CoachMessage from "@/components/CoachMessage";
import ChatInput from "@/components/ChatInput";
import { whatIfResponses } from "@/lib/coach-copy";

const SUGGESTIONS = [
  "What if I have 3 beers tonight?",
  "What if I skip my workout?",
  "What if I stay up until 1am?",
];

const FALLBACK =
  "I only have pre-loaded scenarios for this demo. Try one of the suggestions above — they reference your actual data from the past 14 days.";

interface Message {
  from: "coach" | "user";
  text: string;
  id: number;
}

let idCounter = 0;

export default function WhatIfPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "coach",
      text: "Ask me about any hypothetical decision — I'll tell you what your data says will happen. Try one of the suggestions below.",
      id: idCounter++,
    },
  ]);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (val: string) => {
    if (typing) return;

    const userMsg: Message = { from: "user", text: val, id: idCounter++ };
    setMessages((m) => [...m, userMsg]);
    setTyping(true);

    const response = whatIfResponses[val] ?? FALLBACK;

    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { from: "coach", text: response, id: idCounter++ },
      ]);
      setTyping(false);
    }, 700);
  };

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto px-6 py-8 flex flex-col h-[calc(100vh-5rem)]">
        {/* Header */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-ink-soft/50 mb-2">
            Decision simulator
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink">
            What if<span className="text-sage">?</span>
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            Test decisions against your real history before you make them.
          </p>
        </motion.div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4 pb-4 pr-1">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <CoachMessage
                  text={msg.text}
                  from={msg.from}
                  typewriter={msg.from === "coach" && msg.id > 0}
                  speed={10}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {typing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-sage flex items-center justify-center text-cream text-xs font-semibold font-display">
                V
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-white/90 border border-mint-dark/30 px-4 py-3">
                <div className="flex gap-1 items-center h-4">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-sage/60"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="pt-4 border-t border-mint-dark/30">
          <ChatInput
            suggestions={SUGGESTIONS}
            onSubmit={handleSubmit}
            placeholder="Ask any hypothetical..."
            disabled={typing}
          />
        </div>
      </div>
    </PageShell>
  );
}
