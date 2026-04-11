// Shared weekly-metric computation used by the overview route and any
// legacy recap surface. Splits last14Days into last7 vs prev7 and produces
// four labeled metrics with deltas.

import type { DayData, WeeklyMetric } from "./types";

function avg(fn: (d: DayData) => number, arr: DayData[]): number {
  return arr.length > 0 ? arr.reduce((s, d) => s + fn(d), 0) / arr.length : 0;
}

export interface WeeklyRange {
  metrics: WeeklyMetric[];
  weekLabel: string;
}

function formatWeekRange(days: DayData[]): string {
  const last7 = days.slice(-7);
  if (last7.length === 0) return "";
  const fmt = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(last7[0].date)} – ${fmt(last7[last7.length - 1].date)}`;
}

export function computeWeeklyMetrics(last14Days: DayData[]): WeeklyRange {
  const last7 = last14Days.slice(-7);
  const prev7 = last14Days.slice(-14, -7);

  const avgSleep = avg((d) => d.sleep.durationMin, last7);
  const prevSleep = avg((d) => d.sleep.durationMin, prev7);
  const avgDeep = avg((d) => d.sleep.deepMin, last7);
  const prevDeep = avg((d) => d.sleep.deepMin, prev7);
  const avgRhr = avg((d) => d.heart.restingHr, last7);
  const prevRhr = avg((d) => d.heart.restingHr, prev7);
  const avgSteps = avg((d) => d.activity.steps, last7);
  const prevSteps = avg((d) => d.activity.steps, prev7);

  const sleepH = Math.floor(avgSleep / 60);
  const sleepM = Math.round(avgSleep % 60);

  const metrics: WeeklyMetric[] = [
    {
      label: "Avg Sleep",
      value: `${sleepH}h ${String(sleepM).padStart(2, "0")}m`,
      unit: "",
      delta: Math.round(avgSleep - prevSleep),
      deltaLabel: "min vs prev week",
    },
    {
      label: "Deep Sleep",
      value: String(Math.round(avgDeep)),
      unit: "min",
      delta: Math.round(avgDeep - prevDeep),
      deltaLabel: "vs prev week",
    },
    {
      label: "Resting HR",
      value: String(Math.round(avgRhr)),
      unit: "bpm",
      // Lower RHR is better — invert the delta so negative renders as "good"
      delta: -Math.round(avgRhr - prevRhr),
      deltaLabel: "vs prev week",
    },
    {
      label: "Avg Steps",
      value: Math.round(avgSteps).toLocaleString(),
      unit: "",
      delta: Math.round(avgSteps - prevSteps),
      deltaLabel: "vs prev week",
    },
  ];

  return { metrics, weekLabel: formatWeekRange(last14Days) };
}
