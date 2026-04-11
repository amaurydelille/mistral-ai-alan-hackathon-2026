import type { NextRequest } from "next/server";
import { getDemoIndexFromRequest, getDemoSnapshot } from "@/lib/demo-time";
import {
  marie,
  today as mockToday,
  last14Days as mockLast14Days,
  trends7d as mockTrends7d,
  trends30d as mockTrends30d,
} from "@/lib/mock-data";
import { fetchDailyData } from "@/lib/thryve";
import { transformItManager } from "@/lib/thryve-transform";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Types — discriminated union so metric and behavioral goals are clearly distinct
// ---------------------------------------------------------------------------

export type MetricGoalSuggestion = {
  goalType: "metric";
  title: string;
  metric: string;
  comparator: "gte" | "lte";
  target: number;
  unit: string;
  timeframe: "1d" | "7d";
  rationale: string;
};

export type AbstractGoalSuggestion = {
  goalType: "abstract";
  title: string;
  description: string;
  timeframe: "1d";
  rationale: string;
};

export type GoalSuggestion = MetricGoalSuggestion | AbstractGoalSuggestion;

// ---------------------------------------------------------------------------
// Fallbacks — 2 metric + 1 behavioral
// ---------------------------------------------------------------------------

const FALLBACK_SUGGESTIONS: GoalSuggestion[] = [
  {
    goalType: "metric",
    title: "Sleep at least 7 hours",
    metric: "sleep_duration_min",
    comparator: "gte",
    target: 420,
    unit: "min",
    timeframe: "7d",
    rationale: "Your 7-day average is below 7h and deep sleep is declining — duration is the fastest lever.",
  },
  {
    goalType: "metric",
    title: "Hit 7,000 steps today",
    metric: "steps",
    comparator: "gte",
    target: 7000,
    unit: "steps",
    timeframe: "1d",
    rationale: "You've averaged well under 7k steps this week. A single 7k day breaks the sedentary pattern.",
  },
  {
    goalType: "abstract",
    title: "No caffeine after 4pm",
    description: "No caffeine after 4pm today",
    timeframe: "1d",
    rationale: "Caffeine after 4pm delays sleep onset by ~45min — your sleep debt says you can't afford it.",
  },
];

// ---------------------------------------------------------------------------
// Health snapshot — respects demo mode
// ---------------------------------------------------------------------------

async function getHealthSnapshot(req: NextRequest) {
  const demoIdx = getDemoIndexFromRequest(req);
  if (demoIdx !== null) return getDemoSnapshot(demoIdx);

  const endUserId = process.env.THRYVE_IT_MANAGER_ID;
  try {
    if (!endUserId) throw new Error("no thryve id");
    const now = new Date();
    const endDay = now.toISOString().split("T")[0];
    const start = new Date(now);
    start.setUTCDate(start.getUTCDate() - 30);
    const startDay = start.toISOString().split("T")[0];
    const raw = await fetchDailyData(endUserId, startDay, endDay);
    return transformItManager(raw) as {
      today: typeof mockToday;
      last14Days: typeof mockLast14Days;
      trends7d: typeof mockTrends7d;
      trends30d: typeof mockTrends30d;
    };
  } catch {
    return { today: mockToday, last14Days: mockLast14Days, trends7d: mockTrends7d, trends30d: mockTrends30d };
  }
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const health = await getHealthSnapshot(request);
  const apiKey = process.env.MISTRAL_API_KEY;

  if (!apiKey) {
    return Response.json(FALLBACK_SUGGESTIONS);
  }

  const { today, trends7d, trends30d } = health;
  const profile = "profile" in health ? health.profile : marie;

  const prompt = `You are a personal health coach for ${profile.name}, ${profile.age}, ${profile.job}.
Suggest exactly 3 health goals — at least 1 must be a behavioral/abstract goal (not a number target). Respond ONLY with valid JSON.

User's stated goals: ${profile.goals.join(", ")}
Constraints: ${profile.constraints.join(", ")}

Today's biometrics:
- Sleep: ${today.sleep.durationMin}min (deep: ${today.sleep.deepMin}min, bed ${today.sleep.bedTime}→${today.sleep.wakeTime})
- Resting HR: ${today.heart.restingHr}bpm | Steps: ${today.activity.steps} | Active: ${today.activity.activeMin}min | Sedentary: ${today.activity.sedentaryHours}h
- Stress: ${today.selfReported.stress}/5, Energy: ${today.selfReported.energy}/5, Mood: ${today.selfReported.mood}/5
- Caffeine: ${today.selfReported.caffeine}, Screen before bed: ${today.selfReported.screenBeforeBed ? "yes" : "no"}

7-day trends: sleep avg ${trends7d.avgSleepDuration}min, RHR ${trends7d.avgRhr}bpm (${trends7d.rhrTrend}), steps ${trends7d.avgSteps}, stress ${trends7d.avgStress}/5 (${trends7d.stressTrend})
30-day: sleep avg ${trends30d.avgSleepDuration}min, steps ${trends30d.avgSteps}

Goal types:
- "metric": a measurable number goal. Supported metrics: sleep_duration_min, deep_sleep_min, steps, active_min, resting_hr, sedentary_hours, avg_stress. Timeframes: 1d or 7d. Comparators: gte (higher=better), lte (lower=better).
- "abstract": a behavioral commitment checked against self-reported data. Examples: "No caffeine after 4pm", "No screens 1h before bed", "Walk outside before dinner". Timeframe is always "1d".

Return this exact JSON (2 metric goals + 1 abstract, or 1 metric + 2 abstract — your call based on what would help most):
{
  "suggestions": [
    {
      "goalType": "metric",
      "title": "Short title ≤8 words",
      "metric": "sleep_duration_min",
      "comparator": "gte",
      "target": 420,
      "unit": "min",
      "timeframe": "7d",
      "rationale": "≤18 words referencing their actual numbers"
    },
    {
      "goalType": "abstract",
      "title": "No caffeine after 4pm",
      "description": "No caffeine after 4pm today",
      "timeframe": "1d",
      "rationale": "≤18 words referencing their actual data"
    }
  ]
}

Rules: pick goals the user is currently FAILING. Be specific, reference their numbers. No hedging.`;

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 600,
      }),
    });

    if (!res.ok) return Response.json(FALLBACK_SUGGESTIONS);

    const data = await res.json() as { choices: { message: { content: string } }[] };
    const parsed = JSON.parse(data.choices[0].message.content) as { suggestions?: GoalSuggestion[] };

    if (!parsed.suggestions?.length) return Response.json(FALLBACK_SUGGESTIONS);
    return Response.json(parsed.suggestions.slice(0, 3));
  } catch {
    return Response.json(FALLBACK_SUGGESTIONS);
  }
}
