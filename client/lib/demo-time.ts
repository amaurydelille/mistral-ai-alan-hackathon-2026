import { last14Days, today, marie, trends30d, weeklyMetrics } from "./mock-data";
import type { DayData, Trends } from "./types";

// Full timeline: 14 history days + today = 15 data points
export const DEMO_ALL_DAYS: DayData[] = [...last14Days, today];

// Demo starts at index 7 (April 5 — beginning of the spiral)
// Demo ends at index 14 (April 11 — worst day / launch crunch)
export const DEMO_START_IDX = 7;
export const DEMO_END_IDX = DEMO_ALL_DAYS.length - 1; // 14

export const DEMO_COOKIE = "vd"; // vital demo index

// ---------------------------------------------------------------------------
// Dynamic trend computation from a slice of days
// ---------------------------------------------------------------------------

function computeTrends(days: DayData[]): Trends {
  if (days.length === 0) {
    return {
      avgSleepDuration: 420, avgHrv: 45, hrvTrend: "stable",
      avgRhr: 56, rhrTrend: "stable", avgSteps: 6000,
      avgDeepSleep: 75, deepSleepTrend: "stable", avgStress: 2, stressTrend: "stable",
    };
  }
  const n = days.length;
  const avg = (fn: (d: DayData) => number) => Math.round(days.reduce((s, d) => s + fn(d), 0) / n);
  const trend = (fn: (d: DayData) => number, higher: "better" | "worse"): "improving" | "declining" | "stable" => {
    if (n < 3) return "stable";
    const recent = days.slice(-3).reduce((s, d) => s + fn(d), 0) / 3;
    const older = days.slice(0, Math.max(1, n - 3)).reduce((s, d) => s + fn(d), 0) / Math.max(1, n - 3);
    const delta = (recent - older) / older;
    if (Math.abs(delta) < 0.04) return "stable";
    const improving = higher === "better" ? delta > 0 : delta < 0;
    return improving ? "improving" : "declining";
  };

  return {
    avgSleepDuration: avg(d => d.sleep.durationMin),
    avgHrv: avg(d => d.heart.hrvMs),
    hrvTrend: trend(d => d.heart.hrvMs, "better"),
    avgRhr: avg(d => d.heart.restingHr),
    rhrTrend: trend(d => d.heart.restingHr, "worse") === "declining" ? "rising" :
              trend(d => d.heart.restingHr, "worse") === "improving" ? "declining" : "stable",
    avgSteps: avg(d => d.activity.steps),
    avgDeepSleep: avg(d => d.sleep.deepMin),
    deepSleepTrend: trend(d => d.sleep.deepMin, "better"),
    avgStress: +(days.reduce((s, d) => s + d.selfReported.stress, 0) / n).toFixed(1),
    stressTrend: trend(d => d.selfReported.stress, "worse") === "declining" ? "rising" :
                 trend(d => d.selfReported.stress, "worse") === "improving" ? "declining" : "stable",
  };
}

// ---------------------------------------------------------------------------
// Get a health snapshot for a given demo index
// ---------------------------------------------------------------------------

export function getDemoSnapshot(idx: number) {
  const safeIdx = Math.min(Math.max(idx, 0), DEMO_END_IDX);
  const virtualToday = DEMO_ALL_DAYS[safeIdx];
  // History = all days BEFORE the virtual today (not including it), up to 14
  const history = DEMO_ALL_DAYS.slice(0, safeIdx);
  const virtualLast14 = history.slice(-14);
  const virtualLast7 = history.slice(-7);

  return {
    profile: marie,
    today: virtualToday,
    last14Days: virtualLast14,
    trends7d: computeTrends(virtualLast7),
    trends30d,
    weeklyMetrics,
    thryveScores: [],
  };
}

// ---------------------------------------------------------------------------
// Parse demo index from a Next.js Request object (reads cookie "vd")
// ---------------------------------------------------------------------------

export function getDemoIndexFromRequest(req: { cookies: { get: (name: string) => { value: string } | undefined } }): number | null {
  const raw = req.cookies.get(DEMO_COOKIE)?.value;
  if (raw === undefined || raw === "") return null;
  const n = parseInt(raw, 10);
  if (isNaN(n)) return null;
  return Math.min(Math.max(n, 0), DEMO_END_IDX);
}
