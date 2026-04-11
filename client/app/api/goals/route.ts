import type { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { evaluateGoal } from "@/lib/goals";
import { getDemoIndexFromRequest, getDemoSnapshot } from "@/lib/demo-time";
import type { Goal, GoalWithProgress } from "@/lib/types";
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

// GET /api/goals — list active goals with base progress (no Mistral)
export async function GET(request: NextRequest) {
  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .is("archived_at", null)
    .order("is_primary", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    return Response.json({ error: error.message }, { status: 503 });
  }

  const health = await getHealthSnapshot(request);
  const last7 = health.last14Days.slice(-7);

  const result: GoalWithProgress[] = (data ?? []).map((row) => {
    const goal = rowToGoal(row);
    // Abstract goals always show as "pending" until the evaluate endpoint runs
    if (goal.goalType === "abstract") {
      return { goal, progress: { goalId: goal.id, currentValue: 0, percentComplete: 0, status: "on-track" as const } };
    }
    const { currentValue, percentComplete, status } = evaluateGoal(goal, health.today, last7, health.trends7d);
    return { goal, progress: { goalId: goal.id, currentValue, percentComplete, status } };
  });

  return Response.json(result);
}

// POST /api/goals — create a goal
export async function POST(request: NextRequest) {
  const body = await request.json() as {
    title: string;
    goalType?: Goal["goalType"];
    description?: string;
    metric: Goal["metric"];
    comparator: "gte" | "lte";
    target: number;
    unit: string;
    timeframe: Goal["timeframe"];
    source: Goal["source"];
    rationale?: string;
    isPrimary?: boolean;
  };

  const isAbstract = body.goalType === "abstract";

  // If marking as primary, demote existing primary first
  if (body.isPrimary) {
    await supabase.from("goals").update({ is_primary: false }).eq("is_primary", true);
  }

  const { data, error } = await supabase
    .from("goals")
    .insert({
      title: body.title,
      goal_type: isAbstract ? "abstract" : "metric",
      description: body.description ?? null,
      metric: isAbstract ? "abstract" : body.metric,
      comparator: body.comparator ?? "gte",
      target: isAbstract ? 0 : body.target,
      unit: isAbstract ? "" : body.unit,
      timeframe: body.timeframe,
      source: body.source,
      rationale: body.rationale ?? null,
      is_primary: body.isPrimary ?? false,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(rowToGoal(data), { status: 201 });
}
