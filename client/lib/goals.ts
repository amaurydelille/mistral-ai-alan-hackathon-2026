import type { Goal, GoalMetric, GoalStatus, GoalSentiment, GoalTimeframe } from "./types";
import type { DayData, Trends } from "./types";

// ---------------------------------------------------------------------------
// Metric extraction
// ---------------------------------------------------------------------------

export function extractMetricValue(
  metric: GoalMetric,
  timeframe: GoalTimeframe,
  today: DayData,
  last7: DayData[],
  trends7d: Trends
): number {
  // Abstract goals are evaluated separately via Mistral — never called here
  if (metric === "abstract") return 0;

  if (timeframe === "1d") {
    switch (metric) {
      case "sleep_duration_min": return today.sleep.durationMin;
      case "deep_sleep_min":     return today.sleep.deepMin;
      case "steps":              return today.activity.steps;
      case "active_min":         return today.activity.activeMin;
      case "resting_hr":         return today.heart.restingHr;
      case "sedentary_hours":    return today.activity.sedentaryHours;
      case "avg_stress":         return today.selfReported.stress;
    }
  }

  // 7d averages
  switch (metric) {
    case "sleep_duration_min": return trends7d.avgSleepDuration;
    case "deep_sleep_min":     return trends7d.avgDeepSleep;
    case "steps":              return trends7d.avgSteps;
    case "resting_hr":         return trends7d.avgRhr;
    case "avg_stress":         return trends7d.avgStress;
    case "active_min": {
      if (!last7.length) return 0;
      return Math.round(last7.reduce((s, d) => s + d.activity.activeMin, 0) / last7.length);
    }
    case "sedentary_hours": {
      if (!last7.length) return 0;
      return +(last7.reduce((s, d) => s + d.activity.sedentaryHours, 0) / last7.length).toFixed(1);
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Status classification
// ---------------------------------------------------------------------------

export function classifyStatus(
  current: number,
  target: number,
  comparator: "gte" | "lte"
): GoalStatus {
  const ratio = comparator === "gte" ? current / target : target / current;
  if (ratio >= 1)    return "achieved";
  if (ratio >= 0.9)  return "on-track";
  if (ratio >= 0.75) return "at-risk";
  return "off-track";
}

export function statusToSentiment(status: GoalStatus): GoalSentiment {
  return status === "achieved" || status === "on-track" ? "encouragement" : "warning";
}

// ---------------------------------------------------------------------------
// Full progress computation (no Mistral)
// ---------------------------------------------------------------------------

export function evaluateGoal(
  goal: Goal,
  today: DayData,
  last7: DayData[],
  trends7d: Trends
): { currentValue: number; percentComplete: number; status: GoalStatus } {
  const currentValue = extractMetricValue(goal.metric, goal.timeframe, today, last7, trends7d);
  const status = classifyStatus(currentValue, goal.target, goal.comparator);
  const raw =
    goal.comparator === "gte"
      ? Math.round((currentValue / goal.target) * 100)
      : Math.round((goal.target / Math.max(currentValue, 0.01)) * 100);

  return { currentValue, percentComplete: Math.min(raw, 150), status };
}

// ---------------------------------------------------------------------------
// UI metadata
// ---------------------------------------------------------------------------

export const METRIC_META: Record<
  GoalMetric,
  { label: string; unit: string; comparator: "gte" | "lte"; defaultTarget: number }
> = {
  sleep_duration_min: { label: "Sleep duration",  unit: "min",   comparator: "gte", defaultTarget: 420 },
  deep_sleep_min:     { label: "Deep sleep",       unit: "min",   comparator: "gte", defaultTarget: 60  },
  steps:              { label: "Daily steps",      unit: "steps", comparator: "gte", defaultTarget: 7000 },
  active_min:         { label: "Active minutes",   unit: "min",   comparator: "gte", defaultTarget: 30  },
  resting_hr:         { label: "Resting HR",       unit: "bpm",   comparator: "lte", defaultTarget: 60  },
  sedentary_hours:    { label: "Sedentary hours",  unit: "h",     comparator: "lte", defaultTarget: 8   },
  avg_stress:         { label: "Stress level",     unit: "/5",    comparator: "lte", defaultTarget: 2   },
  // abstract is a sentinel value — never shown in UI dropdowns
  abstract:           { label: "Behavioral",       unit: "",      comparator: "gte", defaultTarget: 0   },
};

// ---------------------------------------------------------------------------
// Fallback Mistral messages (when API key missing)
// ---------------------------------------------------------------------------

export const FALLBACK_MESSAGES: Record<GoalStatus, string> = {
  achieved:  "You've hit your target — great momentum, keep it going.",
  "on-track": "You're close to your goal — one focused effort will get you there.",
  "at-risk":  "You're behind — make one small change today to get back on track.",
  "off-track": "You're well off target — let's reset with one concrete action right now.",
};
