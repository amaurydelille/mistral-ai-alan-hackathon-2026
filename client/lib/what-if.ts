// What-If simulator — conversation model and prompt builder.

import type { HealthData } from "./thryve-transform";

// ---------------------------------------------------------------------------
// Response type
// ---------------------------------------------------------------------------

export interface ChatResponse {
  isFollowUp: boolean;
  text: string; // markdown
}

// ---------------------------------------------------------------------------
// Conversation model
// ---------------------------------------------------------------------------

export interface ConversationTurn {
  id: number;
  question: string;
  response: ChatResponse;
}

/** An exchange groups turns on the same topic. A new exchange starts when
 *  isFollowUp = false. */
export interface ConversationExchange {
  id: number;
  topic: string;
  turns: ConversationTurn[];
}

/** Slim version of a turn sent as conversation history. */
export interface HistoryEntry {
  question: string;
  answer: string; // first 200 chars of the previous answer
}

// ---------------------------------------------------------------------------
// Cache key
// ---------------------------------------------------------------------------

export function normalisedCacheKey(userId: string, question: string, today: string): string {
  const norm = question.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  return `whatif:${userId}:${today}:${norm}`;
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

export function buildPrompt(
  question: string,
  health: HealthData,
  history: HistoryEntry[]
): string {
  const { trends7d: t7, trends30d: t30, today, thryveScores, last14Days } = health;
  const latest = thryveScores[thryveScores.length - 1];

  const fmtMin = (m: number) => (m ? `${Math.floor(m / 60)}h ${m % 60}m` : "—");
  const sleepDebt = Math.max(
    0,
    last14Days.slice(-7).reduce((acc, d) => acc + Math.max(0, 480 - d.sleep.durationMin), 0)
  );

  const histSection = history.length
    ? `\nConversation so far:\n${history
        .map((h, i) => `  [${i + 1}] User: "${h.question}"\n       You: "${h.answer}"`)
        .join("\n")}\n`
    : "";

  return `You are an expert health coach having a direct, honest conversation with a knowledge worker based on their real wearable data.

───── THEIR BIOMETRICS ─────
7-day avg sleep   : ${fmtMin(t7.avgSleepDuration)} (30d avg: ${fmtMin(t30.avgSleepDuration)}, trend: ${t7.deepSleepTrend})
7-day avg deep    : ${t7.avgDeepSleep} min deep sleep
7-day avg RHR     : ${t7.avgRhr} bpm (30d: ${t30.avgRhr} bpm, trend: ${t7.rhrTrend})
Sleep debt (7d)   : ${fmtMin(sleepDebt)}
Last night        : ${fmtMin(today.sleep.durationMin)} total · ${today.sleep.deepMin} min deep · ${Math.round(today.sleep.efficiency * 100)}% efficiency · bed ${today.sleep.bedTime} · wake ${today.sleep.wakeTime} · ${today.sleep.wakeUps} wake-up(s)
${latest ? `Today's risk scores: sick-leave ${latest.sickLeave}/100 · insomnia ${latest.insomniaRisk}/100 · mental health ${latest.mentalHealthRisk}/100` : ""}
${histSection}
───── USER'S QUESTION ─────
"${question}"

───── HOW TO RESPOND ─────
- Reply in **markdown**. Use **bold** for key numbers and verdicts. Use bullet points for lists of effects or tips. Use a short header (##) only if you're covering clearly distinct topics.
- Be specific and personal — always reference their actual numbers (sleep duration, RHR, debt, etc.), not generic ranges.
- Be thorough: 4–8 sentences or a short structured list. Don't pad, don't repeat yourself, but don't cut short either.
- Speak like a knowledgeable friend, not a medical disclaimer machine. Direct, warm, no fluff.
- If it's a follow-up question, continue naturally from the previous exchange. Don't re-introduce yourself.
- isFollowUp = true if the question directly continues the previous topic. false if it's a new subject.

Return ONLY a JSON object, no prose outside it:
{ "isFollowUp": bool, "text": "<your markdown answer here>" }`;
}
