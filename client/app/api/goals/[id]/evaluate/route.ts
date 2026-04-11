import type { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { evaluateGoal, statusToSentiment, FALLBACK_MESSAGES } from "@/lib/goals";
import { getDemoIndexFromRequest, getDemoSnapshot } from "@/lib/demo-time";
import type { Goal, GoalProgress } from "@/lib/types";
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

const cache = new Map<string, { data: GoalProgress; expiresAt: number }>();

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
    };
  } catch {
    return { today: mockToday, last14Days: mockLast14Days, trends7d: mockTrends7d, trends30d: mockTrends30d };
  }
}

function rowToGoal(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    title: row.title as string,
    goalType: ((row.goal_type as string) ?? "metric") as Goal["goalType"],
    description: (row.description as string) ?? null,
    metric: row.metric as Goal["metric"],
    comparator: row.comparator as "gte" | "lte",
    target: Number(row.target),
    unit: row.unit as string,
    timeframe: row.timeframe as Goal["timeframe"],
    source: row.source as Goal["source"],
    rationale: (row.rationale as string) ?? null,
    isPrimary: row.is_primary as boolean,
    createdAt: row.created_at as string,
    archivedAt: (row.archived_at as string) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Abstract goal evaluation — Mistral reads self-reported data
// ---------------------------------------------------------------------------

async function evaluateAbstractGoal(
  goal: Goal,
  health: { today: typeof mockToday; last14Days: typeof mockLast14Days }
): Promise<{ met: boolean; message: string }> {
  const { today } = health;
  const sr = today.selfReported;
  const goalDesc = goal.description ?? goal.title;

  const fallbackMet = false;
  const fallbackMsg = `Could not evaluate "${goalDesc}" — check your data for today.`;

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return { met: fallbackMet, message: fallbackMsg };

  const prompt = `You are a personal health coach. A user made a promise to themselves. Evaluate whether they kept it based on today's self-reported data.

Promise: "${goalDesc}"

Today's self-reported data:
- Caffeine: ${sr.caffeine}
- Alcohol: ${sr.alcohol}
- Meals: ${sr.meals}
- Screens before bed: ${sr.screenBeforeBed ? "yes" : "no"}
- Bed time: ${today.sleep.bedTime}
- Stress: ${sr.stress}/5, Energy: ${sr.energy}/5, Mood: ${sr.mood}/5
- Notes: "${sr.notes || "none"}"

Did they keep this promise today? Respond ONLY with valid JSON:
{
  "met": true or false,
  "message": "≤20 words. If kept: warm and specific ('Promise kept — no caffeine recorded'). If broken: direct and motivating, no lecturing ('Screens logged before bed — try cutting 30min earlier tonight')."
}`;

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 80,
      }),
    });
    if (!res.ok) return { met: fallbackMet, message: fallbackMsg };
    const data = await res.json() as { choices: { message: { content: string } }[] };
    const parsed = JSON.parse(data.choices[0].message.content) as { met?: boolean; message?: string };
    if (typeof parsed.met !== "boolean" || !parsed.message) return { met: fallbackMet, message: fallbackMsg };
    return { met: parsed.met, message: parsed.message };
  } catch {
    return { met: fallbackMet, message: fallbackMsg };
  }
}

// GET /api/goals/:id/evaluate
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Cache key includes demo index so different demo days get different evaluations
  const demoIdx = getDemoIndexFromRequest(request);
  const cacheKey = `${id}:${demoIdx ?? "live"}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiresAt) {
    return Response.json(cached.data, { headers: { "X-Cache": "HIT" } });
  }

  const { data: row, error } = await supabase
    .from("goals")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !row) {
    return Response.json({ error: "Goal not found" }, { status: 404 });
  }

  const goal = rowToGoal(row as Record<string, unknown>);
  const health = await getHealthSnapshot(request);
  const profile = "profile" in health ? health.profile : marie;
  const last7 = health.last14Days.slice(-7);

  let result: GoalProgress;

  if (goal.goalType === "abstract") {
    // Abstract: Mistral evaluates free-text goal against self-reported data
    const { met, message } = await evaluateAbstractGoal(goal, health);
    result = {
      goalId: id,
      currentValue: met ? 1 : 0,
      percentComplete: met ? 100 : 0,
      status: met ? "achieved" : "off-track",
      sentiment: met ? "encouragement" : "warning",
      message,
      evaluatedAt: new Date().toISOString(),
    };
  } else {
    // Metric: numeric evaluation + Mistral message
    const { currentValue, percentComplete, status } = evaluateGoal(goal, health.today, last7, health.trends7d);
    const sentiment = statusToSentiment(status);
    let message = FALLBACK_MESSAGES[status];

    const apiKey = process.env.MISTRAL_API_KEY;
    if (apiKey) {
      const directionWord = goal.comparator === "gte" ? "at least" : "no more than";
      const shortfall = goal.comparator === "gte"
        ? goal.target - currentValue
        : currentValue - goal.target;
      const prompt = `You are coaching ${profile.name}, ${profile.age}, ${profile.job}.
They made a promise: "${goal.title}" — ${directionWord} ${goal.target} ${goal.unit} over ${goal.timeframe === "1d" ? "today" : "7 days"}.
Actual: ${currentValue} ${goal.unit} (${percentComplete}% of target). Status: ${status}.
${status === "achieved" ? `They kept their promise.` : `They ${shortfall > 0 ? `are ${Math.round(shortfall)} ${goal.unit} short` : `exceeded the limit by ${Math.round(-shortfall)} ${goal.unit}`}.`}
Tone: ${sentiment === "encouragement" ? "warm, celebratory, mention the actual number" : "honest and motivating — state the gap, end with one small action"}.
Respond ONLY with valid JSON: { "message": "≤20 words, specific, reference actual numbers" }`;

      try {
        const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: "mistral-large-latest",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.4,
            max_tokens: 80,
          }),
        });
        if (res.ok) {
          const data = await res.json() as { choices: { message: { content: string } }[] };
          const parsed = JSON.parse(data.choices[0].message.content) as { message?: string };
          if (parsed.message) message = parsed.message;
        }
      } catch { /* use fallback */ }
    }

    result = {
      goalId: id,
      currentValue,
      percentComplete,
      status,
      sentiment,
      message,
      evaluatedAt: new Date().toISOString(),
    };
  }

  cache.set(cacheKey, { data: result, expiresAt: Date.now() + 10 * 60 * 1000 });
  return Response.json(result, { headers: { "X-Cache": "MISS" } });
}
