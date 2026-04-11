// Mistral-backed urgent headline for the hero alert band on /overview.
// One sentence, ≤20 words, references the single most load-bearing number.

import type { RiskLevel } from "@/lib/types";

export interface AlertContext {
  riskLevel: RiskLevel;
  composite: number;
  sleepDebtMin: number;
  consecutiveBadNights: number;
  rhrElevationBpm: number;
  todaySleepMin: number;
  avgSleepMin7d: number;
  topDriver: "sick-leave" | "insomnia" | "mental-health";
  topDriverScore: number;
}

export interface AlertResult {
  headline: string;
}

export function buildFallbackAlert(ctx: AlertContext): AlertResult {
  const debtH = Math.round(ctx.sleepDebtMin / 60);
  if (ctx.riskLevel === "high") {
    if (ctx.sleepDebtMin > 240) {
      return {
        headline: `You're carrying ${debtH}h of sleep debt and today's risk is high — recover tonight.`,
      };
    }
    if (ctx.consecutiveBadNights >= 3) {
      return {
        headline: `${ctx.consecutiveBadNights} short nights in a row — today's wellness risk is high at ${ctx.composite}/100.`,
      };
    }
    return {
      headline: `Today's wellness risk is high (${ctx.composite}/100). Act now to protect tomorrow.`,
    };
  }
  if (ctx.riskLevel === "moderate") {
    return {
      headline: `Moderate risk today at ${ctx.composite}/100 — small actions now prevent a red day tomorrow.`,
    };
  }
  return {
    headline: `Green day: wellness ${100 - ctx.composite}/100. Hold the routine that got you here.`,
  };
}

export async function generateAlertHeadline(ctx: AlertContext): Promise<AlertResult> {
  const fallback = buildFallbackAlert(ctx);

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return fallback;

  const debt = `${Math.floor(ctx.sleepDebtMin / 60)}h ${ctx.sleepDebtMin % 60}m`;
  const todaySleepH = `${Math.floor(ctx.todaySleepMin / 60)}h ${ctx.todaySleepMin % 60}m`;
  const avgSleepH = `${Math.floor(ctx.avgSleepMin7d / 60)}h ${ctx.avgSleepMin7d % 60}m`;

  const prompt = `You are a terse, direct health coach. Respond ONLY with valid JSON.

Today's state:
- Wellness risk: ${ctx.riskLevel.toUpperCase()} (composite ${ctx.composite}/100)
- Sleep last night: ${todaySleepH} (7d avg: ${avgSleepH})
- 7d sleep debt: ${debt}
- Consecutive short nights: ${ctx.consecutiveBadNights}
- RHR elevation vs 30d baseline: ${ctx.rhrElevationBpm} bpm
- Dominant risk driver: ${ctx.topDriver} at ${ctx.topDriverScore}/100

Return this exact JSON:
{ "headline": "ONE sentence ≤20 words, present tense, direct, references the single most load-bearing number" }

Rules: no hedging, no 'consider', no 'try to'. Be imperative. Reference the exact number that matters most right now.`;

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
        temperature: 0.2,
        max_tokens: 120,
      }),
    });

    if (!res.ok) return fallback;

    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    const parsed = JSON.parse(data.choices[0].message.content) as { headline?: string };

    if (!parsed.headline) return fallback;
    return { headline: parsed.headline };
  } catch {
    return fallback;
  }
}
