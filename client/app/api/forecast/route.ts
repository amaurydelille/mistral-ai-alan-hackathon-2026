import type { NextRequest } from "next/server";
import { fetchDailyData } from "@/lib/thryve";
import { transformItManager } from "@/lib/thryve-transform";
import { computeForecast } from "@/lib/forecast";
import type { ForecastDay, RescuePlanStep, ForecastResponse } from "@/lib/types";
import type { ComputedForecastDay } from "@/lib/forecast";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// In-memory cache — keyed by (endUserId + calendar date)
// TTL: 1 hour. Health data is daily; no value in re-fetching within the hour.
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: ForecastResponse;
  expiresAt: number;
}

const forecastCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCached(key: string): ForecastResponse | null {
  const entry = forecastCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    forecastCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: ForecastResponse): void {
  forecastCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function subtractDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Mistral narrative generation
// ---------------------------------------------------------------------------

interface NarrativeResult {
  reasons: string[];
  rescuePlan: RescuePlanStep[];
}

async function generateNarrative(
  days: ComputedForecastDay[],
  ctx: {
    avgRhr: number;
    rhrTrend: string;
    avgSleepMin: number;
    deepSleepTrend: string;
    sleepDebtMin: number;
    currentSickLeave: number;
    currentInsomnia: number;
    currentMentalHealth: number;
  }
): Promise<NarrativeResult> {
  const fallback: NarrativeResult = {
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

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return fallback;

  const highestRisk = days.reduce((a, b) => {
    const order = { low: 0, moderate: 1, high: 2 };
    return order[b.risk] > order[a.risk] ? b : a;
  });

  const sleepDebtHours = `${Math.floor(ctx.sleepDebtMin / 60)}h ${ctx.sleepDebtMin % 60}m`;
  const avgSleepHours = `${Math.floor(ctx.avgSleepMin / 60)}h ${ctx.avgSleepMin % 60}m`;

  const prompt = `You are a precise health coach. Respond ONLY with valid JSON.

Biometric context (last 7 days):
- Resting HR: ${ctx.avgRhr} bpm, trend: ${ctx.rhrTrend}
- Average sleep: ${avgSleepHours}, deep sleep trend: ${ctx.deepSleepTrend}
- Sleep debt this week: ${sleepDebtHours}
- Thryve sick-leave risk: ${ctx.currentSickLeave}/100
- Thryve insomnia risk: ${ctx.currentInsomnia}/100
- Thryve mental-health risk: ${ctx.currentMentalHealth}/100

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

Rules: be specific and data-driven, reference actual numbers, no hedging, no generic advice.`;

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

    const data = await res.json() as { choices: { message: { content: string } }[] };
    const parsed = JSON.parse(data.choices[0].message.content) as NarrativeResult;

    // Validate shape
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

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(_request: NextRequest) {
  const endUserId = process.env.THRYVE_IT_MANAGER_ID;
  if (!endUserId) {
    return Response.json({ error: "THRYVE_IT_MANAGER_ID not configured" }, { status: 500 });
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Cache key scoped to user + calendar date so it auto-invalidates at midnight.
  const cacheKey = `${endUserId}:${todayStr}`;
  const cached = getCached(cacheKey);
  if (cached) {
    return Response.json(cached, {
      headers: { "X-Cache": "HIT" },
    });
  }

  const endDay = todayStr;
  const startDay = subtractDays(today, 30);

  try {
    const raw = await fetchDailyData(endUserId, startDay, endDay);
    const health = transformItManager(raw);

    const computed = computeForecast(
      health.thryveScores,
      health.last14Days,
      health.trends7d,
      health.trends30d
    );

    const narrative = await generateNarrative(computed.days, {
      avgRhr: health.trends7d.avgRhr,
      rhrTrend: health.trends7d.rhrTrend,
      avgSleepMin: health.trends7d.avgSleepDuration,
      deepSleepTrend: health.trends7d.deepSleepTrend,
      sleepDebtMin: computed.sleepDebtMin,
      currentSickLeave: computed.currentScores.sickLeave,
      currentInsomnia: computed.currentScores.insomniaRisk,
      currentMentalHealth: computed.currentScores.mentalHealthRisk,
    });

    const forecast: ForecastDay[] = computed.days.map((d, i) => ({
      date: d.date,
      label: d.label,
      risk: d.risk,
      reason: narrative.reasons[i] ?? `${d.risk} risk based on current trend.`,
      composite: d.composite,
      sickLeave: d.sickLeave,
      insomniaRisk: d.insomniaRisk,
      mentalHealthRisk: d.mentalHealthRisk,
    }));

    const response: ForecastResponse = {
      forecast,
      rescuePlan: narrative.rescuePlan,
      computed: {
        currentScores: computed.currentScores,
        sleepDebtMin: computed.sleepDebtMin,
        historicalComposites: computed.historicalComposites,
        historicalDates: computed.historicalDates,
        dataSource: computed.dataSource,
      },
    };

    setCache(cacheKey, response);

    return Response.json(response, {
      headers: { "X-Cache": "MISS" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
