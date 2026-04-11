// Mistral-backed 3-day forecast narrative.
// Extracted from /app/api/forecast/route.ts so multiple routes can share it.

import type { RescuePlanStep } from "@/lib/types";
import type { ComputedForecastDay } from "@/lib/forecast";

export interface ForecastNarrativeContext {
  avgRhr: number;
  rhrTrend: string;
  avgSleepMin: number;
  deepSleepTrend: string;
  sleepDebtMin: number;
  currentSickLeave: number;
  currentInsomnia: number;
  currentMentalHealth: number;
  consecutiveBadNights: number;
  bedtimeVarianceMin: number;
  rhrElevationBpm: number;
  projectionBias: number;
  /** Active promise titles — rescue plan avoids duplicating these */
  activePromises?: string[];
}

export interface ForecastNarrativeResult {
  reasons: string[];
  rescuePlan: RescuePlanStep[];
}

export function buildFallbackForecastNarrative(
  ctx: ForecastNarrativeContext
): ForecastNarrativeResult {
  return {
    reasons: [
      `Sick-leave risk at ${ctx.currentSickLeave}/100 — sleep debt of ${Math.round(ctx.sleepDebtMin / 60)}h is the primary driver.`,
      `Insomnia risk rising (${ctx.currentInsomnia}/100) and resting HR trending ${ctx.rhrTrend}.`,
      `Cumulative signals converging — recovery window is narrowing without intervention today.`,
    ],
    rescuePlan: [
      { step: 1, action: "In bed by 22:30 tonight", why: "Consistent sleep timing stabilises circadian rhythm and lowers RHR by ~3 bpm." },
      { step: 2, action: "No caffeine after 14:00", why: "Caffeine's 6h half-life directly fragments deep sleep — your weakest signal right now." },
      { step: 3, action: "10-min walk before dinner", why: "Light activity post-sedentary hours accelerates overnight heart rate recovery." },
    ],
  };
}

export async function generateForecastNarrative(
  days: ComputedForecastDay[],
  ctx: ForecastNarrativeContext
): Promise<ForecastNarrativeResult> {
  const fallback = buildFallbackForecastNarrative(ctx);

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return fallback;

  const highestRisk = days.reduce((a, b) => {
    const order = { low: 0, moderate: 1, high: 2 };
    return order[b.risk] > order[a.risk] ? b : a;
  });

  const sleepDebtHours = `${Math.floor(ctx.sleepDebtMin / 60)}h ${ctx.sleepDebtMin % 60}m`;
  const avgSleepHours = `${Math.floor(ctx.avgSleepMin / 60)}h ${ctx.avgSleepMin % 60}m`;

  const activePromisesBlock =
    ctx.activePromises && ctx.activePromises.length > 0
      ? `\nUser's active promises (already committed — do NOT duplicate as rescue steps; acknowledge them as covered if relevant):\n${ctx.activePromises.map((p) => `- ${p}`).join("\n")}\n`
      : "";

  const prompt = `You are a precise health coach. Respond ONLY with valid JSON.

Biometric context (last 7 days):
- Resting HR: ${ctx.avgRhr} bpm (trend: ${ctx.rhrTrend}${ctx.rhrElevationBpm >= 3 ? `, +${ctx.rhrElevationBpm} bpm above 30d baseline` : ""})
- Average sleep: ${avgSleepHours} (deep sleep trend: ${ctx.deepSleepTrend})
- Sleep debt this week: ${sleepDebtHours}${ctx.projectionBias > 0 ? ` (adding +${ctx.projectionBias} pts to projection)` : ""}
- Consecutive nights below average: ${ctx.consecutiveBadNights}
- Bedtime schedule variance: ±${ctx.bedtimeVarianceMin} min
- Thryve sick-leave risk: ${ctx.currentSickLeave}/100
- Thryve insomnia risk: ${ctx.currentInsomnia}/100
- Thryve mental-health risk: ${ctx.currentMentalHealth}/100
${activePromisesBlock}
3-day forecast (computed via EWMA + projection):
${days.map((d, i) => `Day ${i + 1} — ${d.label}: composite ${d.composite}/100 (${d.risk.toUpperCase()}). Sick leave: ${d.sickLeave}, Insomnia: ${d.insomniaRisk}, Mental: ${d.mentalHealthRisk}`).join("\n")}

Highest-risk day requiring rescue plan: ${highestRisk.label} (composite ${highestRisk.composite}/100)

Return this exact JSON structure:
{
  "reasons": [
    "≤18 words explaining the dominant signal for day 1",
    "≤18 words explaining the dominant signal for day 2",
    "≤18 words explaining the dominant signal for day 3"
  ],
  "rescuePlan": [
    { "step": 1, "action": "≤7 word action title", "why": "≤20 word physiological reason" },
    { "step": 2, "action": "≤7 word action title", "why": "≤20 word physiological reason" },
    { "step": 3, "action": "≤7 word action title", "why": "≤20 word physiological reason" }
  ]
}

Rules: be specific and data-driven, reference actual numbers, no hedging, no generic advice. If all 3 rescue steps would duplicate existing promises, propose complementary actions instead.`;

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
        temperature: 0.25,
        max_tokens: 600,
      }),
    });

    if (!res.ok) return fallback;

    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    const parsed = JSON.parse(data.choices[0].message.content) as ForecastNarrativeResult;

    if (
      !Array.isArray(parsed.reasons) ||
      parsed.reasons.length < 3 ||
      !Array.isArray(parsed.rescuePlan) ||
      parsed.rescuePlan.length < 3
    ) {
      return fallback;
    }

    return parsed;
  } catch {
    return fallback;
  }
}
