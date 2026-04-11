// Mistral-backed weekly recap story: past-tense narrative arc for the last
// 7 days vs. the prior 7. Used in the /overview weekly recap section.

import type { WeeklyMetric } from "@/lib/types";

export interface RecapContext {
  weekLabel: string;
  weeklyMetrics: WeeklyMetric[];
  sleepDebtMin: number;
  consecutiveBadNights: number;
  currentComposite: number;
  prevComposite: number | null;
  userName: string;
}

export interface RecapResult {
  headline: string;
  narrative: string;
  nextWeekGoal: string;
}

function describeBiggestMover(metrics: WeeklyMetric[]): WeeklyMetric | null {
  let top: WeeklyMetric | null = null;
  let topMagnitude = 0;
  for (const m of metrics) {
    const mag = Math.abs(m.delta);
    if (mag > topMagnitude) {
      topMagnitude = mag;
      top = m;
    }
  }
  return top;
}

export function buildFallbackRecap(ctx: RecapContext): RecapResult {
  const mover = describeBiggestMover(ctx.weeklyMetrics);
  const compositeDelta =
    ctx.prevComposite !== null ? Math.round(ctx.currentComposite - ctx.prevComposite) : 0;

  const headline = mover
    ? `${mover.label} ${mover.delta >= 0 ? "up" : "down"} ${Math.abs(mover.delta)} ${mover.deltaLabel.split(" ")[0]}`
    : "A week of mixed signals";

  const debtLine =
    ctx.sleepDebtMin > 120
      ? ` Sleep debt sits at ${Math.round(ctx.sleepDebtMin / 60)}h.`
      : " Sleep debt is under control.";

  const trendLine =
    compositeDelta > 0
      ? ` Overall risk drifted ${compositeDelta} points higher vs. the prior week.`
      : compositeDelta < 0
      ? ` Overall risk improved by ${Math.abs(compositeDelta)} points vs. the prior week.`
      : "";

  const narrative =
    `This past week showed ${mover ? `${mover.label.toLowerCase()} ${mover.delta >= 0 ? "climbing" : "dropping"} by ${Math.abs(mover.delta)}` : "steady numbers"}.` +
    debtLine +
    trendLine +
    ` ${ctx.consecutiveBadNights >= 2 ? `${ctx.consecutiveBadNights} consecutive short nights are the story to reverse.` : "Consistency was the quiet win."}`;

  const nextWeekGoal =
    ctx.sleepDebtMin > 180
      ? "Bank 7h sleep at least 5 nights to pay down debt."
      : ctx.currentComposite >= 65
      ? "Break the pattern: in bed by 22:30 four nights this week."
      : "Protect the baseline — keep bedtime within ±30 min.";

  return { headline, narrative, nextWeekGoal };
}

export async function generateRecapNarrative(ctx: RecapContext): Promise<RecapResult> {
  const fallback = buildFallbackRecap(ctx);

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return fallback;

  const metricLines = ctx.weeklyMetrics
    .map((m) => `- ${m.label}: ${m.value}${m.unit} (${m.delta >= 0 ? "+" : ""}${m.delta} ${m.deltaLabel})`)
    .join("\n");

  const compositeDelta =
    ctx.prevComposite !== null ? Math.round(ctx.currentComposite - ctx.prevComposite) : 0;

  const prompt = `You are a thoughtful health coach writing a weekly recap for ${ctx.userName}. Past tense. Respond ONLY with valid JSON.

Week: ${ctx.weekLabel}

Weekly metrics (last 7 days vs prior 7 days):
${metricLines}

Recovery signals:
- 7-day sleep debt: ${Math.floor(ctx.sleepDebtMin / 60)}h ${ctx.sleepDebtMin % 60}m
- Consecutive short nights: ${ctx.consecutiveBadNights}
- Current wellness risk composite: ${ctx.currentComposite}/100${ctx.prevComposite !== null ? ` (prior week: ${ctx.prevComposite}/100, delta ${compositeDelta >= 0 ? "+" : ""}${compositeDelta})` : ""}

Return this exact JSON:
{
  "headline": "≤12 words, past tense, captures the story of the week in one line",
  "narrative": "3-4 sentences, past tense, reference actual numbers, warm but direct",
  "nextWeekGoal": "≤15 words, one concrete commitment for the coming week"
}

Rules: past tense for headline + narrative, future/imperative for next week goal. Reference real numbers. No generic advice.`;

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.35,
        max_tokens: 450,
      }),
    });

    if (!res.ok) return fallback;

    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    const parsed = JSON.parse(data.choices[0].message.content) as {
      headline?: string;
      narrative?: string;
      nextWeekGoal?: string;
    };

    if (!parsed.headline || !parsed.narrative || !parsed.nextWeekGoal) return fallback;

    return {
      headline: parsed.headline,
      narrative: parsed.narrative,
      nextWeekGoal: parsed.nextWeekGoal,
    };
  } catch {
    return fallback;
  }
}
