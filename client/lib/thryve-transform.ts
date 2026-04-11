// Transforms raw Thryve daily API response into the app's typed data model.
// Specific to the IT Manager (Withings) profile — field availability reflects
// what Withings actually provides (no REM sleep, no HRV/Rmssd, limited steps).

import type { ThryveRawDaily, ThryveDailyRecord } from "./thryve";
import type {
  UserProfile,
  DayData,
  SleepData,
  HeartData,
  ActivityData,
  SelfReported,
  Trends,
  WeeklyMetric,
} from "./types";

// Thryve returns SleepStartTime/SleepEndTime as ISO 8601 UTC strings.
// The IT Manager is in France (UTC+1 → timezoneOffset = 60 min).
// Extract local time as "HH:mm".
function isoUtcToLocalTime(iso: string, tzOffsetMin: number): string {
  const date = new Date(iso);
  const localMs = date.getTime() + tzOffsetMin * 60 * 1000;
  const local = new Date(localMs);
  const h = local.getUTCHours().toString().padStart(2, "0");
  const m = local.getUTCMinutes().toString().padStart(2, "0");
  return `${h}:${m}`;
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function trend(
  values: number[],
  risePosLabel: "rising" | "improving",
  riseNegLabel: "declining" | "rising",
  stableLabel: "stable"
): "rising" | "declining" | "improving" | "stable" {
  if (values.length < 4) return stableLabel;
  const half = Math.floor(values.length / 2);
  const firstHalfAvg = avg(values.slice(0, half));
  const secondHalfAvg = avg(values.slice(half));
  const delta = secondHalfAvg - firstHalfAvg;
  const threshold = firstHalfAvg * 0.03; // 3% change = non-stable
  if (delta > threshold) return risePosLabel;
  if (delta < -threshold) return riseNegLabel;
  return stableLabel;
}

// ----- Build a day-keyed lookup from all data sources -----

type DayMap = Map<string, Map<string, string>>;

function buildDayMap(raw: ThryveRawDaily[]): DayMap {
  const map: DayMap = new Map();
  if (!raw?.length) return map;

  for (const source of raw[0].dataSources) {
    for (const record of source.data) {
      if (!map.has(record.day)) map.set(record.day, new Map());
      const dayFields = map.get(record.day)!;
      // Prefer ThryveMain* variants (Thryve-computed) when available,
      // otherwise keep the first value seen for this type name.
      const name = record.dailyDynamicValueTypeName;
      if (!dayFields.has(name)) dayFields.set(name, record.value);
    }
  }
  return map;
}

// Get timezone offset from first record's details, default to 60 (UTC+1, France)
function getTimezoneOffset(raw: ThryveRawDaily[]): number {
  if (!raw?.length) return 60;
  for (const source of raw[0].dataSources) {
    for (const record of source.data) {
      if (record.details?.timezoneOffset !== undefined) {
        return record.details.timezoneOffset;
      }
    }
  }
  return 60;
}

function buildSleep(fields: Map<string, string>, tzOffset: number): SleepData {
  const startIso = fields.get("SleepStartTime") ?? fields.get("ThryveMainSleepStartTime");
  const endIso = fields.get("SleepEndTime") ?? fields.get("ThryveMainSleepEndTime");
  const effRaw = fields.get("SleepEfficiency") ?? fields.get("ThryveMainSleepEfficiency");

  return {
    durationMin: Math.round(Number(fields.get("SleepDuration") ?? fields.get("ThryveMainSleepDuration") ?? 0)),
    bedTime: startIso ? isoUtcToLocalTime(startIso, tzOffset) : "00:00",
    wakeTime: endIso ? isoUtcToLocalTime(endIso, tzOffset) : "00:00",
    deepMin: Math.round(Number(fields.get("SleepDeepDuration") ?? fields.get("ThryveMainSleepDeepDuration") ?? 0)),
    remMin: Math.round(Number(fields.get("SleepREMDuration") ?? fields.get("ThryveMainSleepREMDuration") ?? 0)),
    lightMin: Math.round(Number(fields.get("SleepLightDuration") ?? fields.get("ThryveMainSleepLightDuration") ?? 0)),
    awakeMin: Math.round(Number(fields.get("SleepAwakeDuration") ?? fields.get("ThryveMainSleepAwakeDuration") ?? 0)),
    // Withings reports efficiency as 0–100; normalise to 0–1
    efficiency: effRaw ? Number(effRaw) / 100 : 0,
    wakeUps: Math.round(Number(fields.get("SleepInterruptions") ?? fields.get("ThryveMainSleepInterruptions") ?? 0)),
  };
}

function buildHeart(fields: Map<string, string>): HeartData {
  return {
    restingHr: Math.round(Number(fields.get("HeartRateResting") ?? 0)),
    // Withings (IT Manager) does not provide HRV — use 0 as sentinel
    hrvMs: Math.round(Number(fields.get("Rmssd") ?? 0)),
  };
}

function buildActivity(fields: Map<string, string>, sleepMin: number): ActivityData {
  const activeMin = Math.round(Number(fields.get("ActiveDuration") ?? fields.get("ActivityDuration") ?? 0));
  const sedMin = fields.get("ActivitySedentaryDuration")
    ? Math.round(Number(fields.get("ActivitySedentaryDuration")))
    : Math.max(0, 1440 - sleepMin - activeMin);

  return {
    steps: Math.round(Number(fields.get("Steps") ?? 0)),
    activeMin,
    sedentaryHours: Math.round((sedMin / 60) * 10) / 10,
    workouts: [],
  };
}

const DEFAULT_SELF_REPORTED: SelfReported = {
  stress: 0,
  energy: 0,
  mood: 0,
  caffeine: "",
  alcohol: "",
  meals: "",
  screenBeforeBed: false,
  notes: "",
};

function buildDay(date: string, fields: Map<string, string>, tzOffset: number): DayData {
  const sleep = buildSleep(fields, tzOffset);
  return {
    date,
    sleep,
    heart: buildHeart(fields),
    activity: buildActivity(fields, sleep.durationMin),
    selfReported: { ...DEFAULT_SELF_REPORTED },
  };
}

// ----- Trends -----

function calcTrends(days: DayData[]): Trends {
  const sleepDurations = days.map((d) => d.sleep.durationMin).filter((v) => v > 0);
  const deepSleeps = days.map((d) => d.sleep.deepMin).filter((v) => v > 0);
  const rhrs = days.map((d) => d.heart.restingHr).filter((v) => v > 0);
  const steps = days.map((d) => d.activity.steps).filter((v) => v > 0);

  return {
    avgSleepDuration: avg(sleepDurations),
    avgHrv: 0, // not available from Withings IT Manager
    hrvTrend: "stable",
    avgRhr: avg(rhrs),
    rhrTrend: trend(rhrs, "rising", "declining", "stable") as "rising" | "declining" | "stable",
    avgSteps: avg(steps),
    avgDeepSleep: avg(deepSleeps),
    deepSleepTrend: trend(deepSleeps, "improving", "declining", "stable") as "declining" | "stable" | "improving",
    avgStress: 0, // not available from wearable
    stressTrend: "stable",
  };
}

// ----- Weekly metrics -----

function buildWeeklyMetrics(
  days7d: DayData[],
  days30d: DayData[],
  thryveScores: ThryveScore[]
): WeeklyMetric[] {
  const t7 = calcTrends(days7d);
  const t30 = calcTrends(days30d);

  const fmtMin = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${h}h ${min.toString().padStart(2, "0")}m`;
  };

  const latestScore = thryveScores.length
    ? thryveScores[thryveScores.length - 1]
    : null;

  return [
    {
      label: "Avg Sleep",
      value: fmtMin(t7.avgSleepDuration),
      unit: "",
      delta: t7.avgSleepDuration - t30.avgSleepDuration,
      deltaLabel: "vs 30d avg",
    },
    {
      label: "Resting HR",
      value: String(t7.avgRhr),
      unit: "bpm",
      delta: t7.avgRhr - t30.avgRhr,
      deltaLabel: "vs 30d avg",
    },
    {
      label: "Avg Steps",
      value: t7.avgSteps.toLocaleString(),
      unit: "",
      delta: t7.avgSteps - t30.avgSteps,
      deltaLabel: "vs 30d avg",
    },
    {
      label: "Sick Leave Risk",
      value: latestScore ? String(latestScore.sickLeave) : "—",
      unit: "/100",
      delta: 0,
      deltaLabel: "Thryve score",
    },
  ];
}

// ----- Thryve health risk scores -----

export interface ThryveScore {
  date: string;
  sickLeave: number;
  insomniaRisk: number;
  mentalHealthRisk: number;
  cardiovascularRisk: number;
  dementiaRisk: number;
  mortalityRisk: number;
}

function buildThryveScores(map: DayMap): ThryveScore[] {
  const scores: ThryveScore[] = [];
  for (const [date, fields] of map) {
    const sickLeave = fields.get("ThryveMainSleepRelatedSickLeavePrediction");
    if (!sickLeave) continue;
    scores.push({
      date,
      sickLeave: Number(sickLeave),
      insomniaRisk: Number(fields.get("ThryveInsomniaRisk") ?? 0),
      mentalHealthRisk: Number(fields.get("ThryveMainSleepRelatedMentalHealthRisk") ?? 0),
      cardiovascularRisk: Number(fields.get("ThryveMainSleepRelatedCardiovascularRisk") ?? 0),
      dementiaRisk: Number(fields.get("ThryveMainSleepRelatedDementiaRisk") ?? 0),
      mortalityRisk: Number(fields.get("ThryveMainSleepRelatedMortalityRisk") ?? 0),
    });
  }
  return scores.sort((a, b) => a.date.localeCompare(b.date));
}

// ----- Main export -----

export interface HealthData {
  profile: UserProfile;
  today: DayData;
  last14Days: DayData[];
  trends7d: Trends;
  trends30d: Trends;
  weeklyMetrics: WeeklyMetric[];
  thryveScores: ThryveScore[];
}

export function transformItManager(raw: ThryveRawDaily[]): HealthData {
  const dayMap = buildDayMap(raw);
  const tzOffset = getTimezoneOffset(raw);

  // Sort all available dates descending
  const sortedDates = [...dayMap.keys()].sort((a, b) => b.localeCompare(a));

  if (!sortedDates.length) {
    throw new Error("No data returned from Thryve for IT Manager profile");
  }

  // "Today" is the most recent date with sleep data
  const todayDate = sortedDates.find((d) => {
    const f = dayMap.get(d)!;
    return Number(f.get("SleepDuration") ?? f.get("ThryveMainSleepDuration") ?? 0) > 0;
  }) ?? sortedDates[0];

  const todayFields = dayMap.get(todayDate)!;
  const today = buildDay(todayDate, todayFields, tzOffset);

  // last14Days: up to 14 days before today, oldest first.
  // Over-sample (28 days), filter out fully-unsynced days, take 14, then crop
  // from the end so all series stop at the last day where every non-optional
  // metric has a valid value (restingHr can never be 0 on a real day).
  const last14DaysRaw = sortedDates
    .filter((d) => d < todayDate)
    .slice(0, 28)
    .map((d) => buildDay(d, dayMap.get(d)!, tzOffset))
    .filter((d) => d.sleep.durationMin > 0 || d.activity.steps > 0 || d.heart.restingHr > 0)
    .slice(0, 14)
    .reverse();

  // Find the last index where all non-optional metrics are valid.
  let validUntil = last14DaysRaw.length - 1;
  while (validUntil >= 0 && last14DaysRaw[validUntil].heart.restingHr === 0) {
    validUntil--;
  }
  const last14Days = last14DaysRaw.slice(0, validUntil + 1);

  // Windows for trends (use all available data, capped)
  const all = [...sortedDates].reverse().map((d) => buildDay(d, dayMap.get(d)!, tzOffset));
  const days7d = all.slice(-7);
  const days30d = all.slice(-30);

  const trends7d = calcTrends(days7d);
  const trends30d = calcTrends(days30d);

  const thryveScores = buildThryveScores(dayMap);

  const weeklyMetrics = buildWeeklyMetrics(days7d, days30d, thryveScores);

  const profile: UserProfile = {
    name: "IT Manager",
    age: 45,
    job: "IT Manager",
    goals: ["sleep better", "reduce cardiovascular risk", "stay active"],
    constraints: [],
    baselineHrv: 0, // not available
    baselineRhr: trends30d.avgRhr || trends7d.avgRhr,
  };

  return { profile, today, last14Days, trends7d, trends30d, weeklyMetrics, thryveScores };
}
