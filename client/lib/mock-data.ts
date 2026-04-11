import type {
  UserProfile,
  DayData,
  Trends,
  ForecastDay,
  WeeklyMetric,
} from "./types";

// Marie — 31 y/o Product Manager in Paris, narrative arc: good → stress → spiral → partial recovery
export const marie: UserProfile = {
  name: "Marie",
  age: 31,
  job: "Product Manager, Paris startup",
  goals: ["sleep better", "reduce stress", "move more"],
  constraints: ["no gym access", "busy evenings"],
  baselineHrv: 45,
  baselineRhr: 56,
};

// Today — deep in Week 3 (spiral phase)
export const today: DayData = {
  date: "2026-04-11",
  sleep: {
    durationMin: 330, // 5h30
    bedTime: "01:15",
    wakeTime: "06:45",
    deepMin: 38,
    remMin: 52,
    lightMin: 215,
    awakeMin: 45,
    efficiency: 0.81,
    wakeUps: 4,
  },
  heart: {
    restingHr: 67,
    hrvMs: 29,
  },
  activity: {
    steps: 3200,
    activeMin: 12,
    sedentaryHours: 13,
    workouts: [],
  },
  selfReported: {
    stress: 5,
    energy: 2,
    mood: 2,
    caffeine: "3 coffees (8h, 11h, 16h)",
    alcohol: "2 glasses of wine",
    meals: "skipped lunch, late pasta 22h",
    screenBeforeBed: true,
    notes: "product launch stress",
  },
};

// 14-day history (day 1 = oldest, day 14 = yesterday)
export const last14Days: DayData[] = [
  // Week 1 — good baseline
  {
    date: "2026-03-29",
    sleep: { durationMin: 432, bedTime: "23:00", wakeTime: "07:12", deepMin: 82, remMin: 94, lightMin: 228, awakeMin: 18, efficiency: 0.94, wakeUps: 1 },
    heart: { restingHr: 56, hrvMs: 47 },
    activity: { steps: 7800, activeMin: 45, sedentaryHours: 8, workouts: ["yoga 30min"] },
    selfReported: { stress: 2, energy: 4, mood: 4, caffeine: "1 coffee", alcohol: "none", meals: "regular meals", screenBeforeBed: false, notes: "" },
  },
  {
    date: "2026-03-30",
    sleep: { durationMin: 420, bedTime: "23:15", wakeTime: "07:15", deepMin: 78, remMin: 88, lightMin: 230, awakeMin: 22, efficiency: 0.93, wakeUps: 1 },
    heart: { restingHr: 55, hrvMs: 48 },
    activity: { steps: 8200, activeMin: 38, sedentaryHours: 9, workouts: [] },
    selfReported: { stress: 2, energy: 4, mood: 4, caffeine: "2 coffees", alcohol: "none", meals: "regular meals", screenBeforeBed: false, notes: "" },
  },
  {
    date: "2026-03-31",
    sleep: { durationMin: 438, bedTime: "22:45", wakeTime: "07:08", deepMin: 85, remMin: 96, lightMin: 232, awakeMin: 15, efficiency: 0.95, wakeUps: 1 },
    heart: { restingHr: 55, hrvMs: 49 },
    activity: { steps: 9100, activeMin: 52, sedentaryHours: 8, workouts: ["walk 45min"] },
    selfReported: { stress: 1, energy: 5, mood: 5, caffeine: "1 coffee", alcohol: "none", meals: "regular meals", screenBeforeBed: false, notes: "great day" },
  },
  // Week 2 — stress begins
  {
    date: "2026-04-01",
    sleep: { durationMin: 390, bedTime: "00:00", wakeTime: "06:30", deepMin: 65, remMin: 78, lightMin: 225, awakeMin: 32, efficiency: 0.88, wakeUps: 2 },
    heart: { restingHr: 58, hrvMs: 43 },
    activity: { steps: 5600, activeMin: 22, sedentaryHours: 10, workouts: [] },
    selfReported: { stress: 3, energy: 3, mood: 3, caffeine: "2 coffees", alcohol: "1 glass", meals: "skipped breakfast", screenBeforeBed: true, notes: "sprint started" },
  },
  {
    date: "2026-04-02",
    sleep: { durationMin: 372, bedTime: "00:30", wakeTime: "06:42", deepMin: 58, remMin: 70, lightMin: 220, awakeMin: 34, efficiency: 0.85, wakeUps: 2 },
    heart: { restingHr: 60, hrvMs: 41 },
    activity: { steps: 4800, activeMin: 18, sedentaryHours: 11, workouts: [] },
    selfReported: { stress: 3, energy: 3, mood: 3, caffeine: "2 coffees (9h, 15h)", alcohol: "none", meals: "delivery lunch, light dinner", screenBeforeBed: true, notes: "" },
  },
  {
    date: "2026-04-03",
    sleep: { durationMin: 360, bedTime: "01:00", wakeTime: "07:00", deepMin: 52, remMin: 65, lightMin: 218, awakeMin: 35, efficiency: 0.83, wakeUps: 3 },
    heart: { restingHr: 61, hrvMs: 39 },
    activity: { steps: 4200, activeMin: 15, sedentaryHours: 12, workouts: [] },
    selfReported: { stress: 4, energy: 2, mood: 3, caffeine: "3 coffees (8h, 13h, 16h30)", alcohol: "2 beers", meals: "skipped lunch", screenBeforeBed: true, notes: "team conflict" },
  },
  {
    date: "2026-04-04",
    sleep: { durationMin: 348, bedTime: "01:15", wakeTime: "07:00", deepMin: 48, remMin: 60, lightMin: 216, awakeMin: 38, efficiency: 0.81, wakeUps: 3 },
    heart: { restingHr: 63, hrvMs: 36 },
    activity: { steps: 3800, activeMin: 14, sedentaryHours: 12, workouts: [] },
    selfReported: { stress: 4, energy: 2, mood: 2, caffeine: "3 coffees", alcohol: "1 glass wine", meals: "irregular, large dinner 22h", screenBeforeBed: true, notes: "" },
  },
  // Week 3 — the spiral
  {
    date: "2026-04-05",
    sleep: { durationMin: 330, bedTime: "01:30", wakeTime: "07:00", deepMin: 40, remMin: 55, lightMin: 208, awakeMin: 47, efficiency: 0.78, wakeUps: 4 },
    heart: { restingHr: 65, hrvMs: 33 },
    activity: { steps: 3200, activeMin: 10, sedentaryHours: 13, workouts: [] },
    selfReported: { stress: 5, energy: 1, mood: 2, caffeine: "3 coffees (8h, 12h, 16h)", alcohol: "2 glasses wine", meals: "skipped lunch, pasta 22h", screenBeforeBed: true, notes: "exhausted" },
  },
  {
    date: "2026-04-06",
    sleep: { durationMin: 318, bedTime: "01:45", wakeTime: "07:00", deepMin: 35, remMin: 50, lightMin: 205, awakeMin: 48, efficiency: 0.75, wakeUps: 5 },
    heart: { restingHr: 68, hrvMs: 28 },
    activity: { steps: 2800, activeMin: 8, sedentaryHours: 14, workouts: [] },
    selfReported: { stress: 5, energy: 1, mood: 1, caffeine: "3 coffees (8h, 11h, 16h30)", alcohol: "3 beers", meals: "skipped both meals, chips dinner", screenBeforeBed: true, notes: "worst day" },
  },
  {
    date: "2026-04-07",
    sleep: { durationMin: 342, bedTime: "01:00", wakeTime: "06:42", deepMin: 42, remMin: 56, lightMin: 214, awakeMin: 40, efficiency: 0.80, wakeUps: 4 },
    heart: { restingHr: 66, hrvMs: 30 },
    activity: { steps: 3500, activeMin: 12, sedentaryHours: 12, workouts: [] },
    selfReported: { stress: 4, energy: 2, mood: 2, caffeine: "2 coffees (9h, 15h)", alcohol: "1 glass wine", meals: "light lunch, normal dinner", screenBeforeBed: true, notes: "" },
  },
  // Week 4 — partial recovery (following app advice)
  {
    date: "2026-04-08",
    sleep: { durationMin: 360, bedTime: "00:30", wakeTime: "06:30", deepMin: 52, remMin: 62, lightMin: 218, awakeMin: 38, efficiency: 0.83, wakeUps: 3 },
    heart: { restingHr: 64, hrvMs: 33 },
    activity: { steps: 4800, activeMin: 22, sedentaryHours: 11, workouts: ["walk 20min"] },
    selfReported: { stress: 4, energy: 2, mood: 3, caffeine: "2 coffees (8h, 13h)", alcohol: "none", meals: "proper breakfast, regular lunch", screenBeforeBed: false, notes: "tried to go to bed earlier" },
  },
  {
    date: "2026-04-09",
    sleep: { durationMin: 378, bedTime: "00:00", wakeTime: "06:18", deepMin: 58, remMin: 68, lightMin: 222, awakeMin: 32, efficiency: 0.86, wakeUps: 2 },
    heart: { restingHr: 63, hrvMs: 35 },
    activity: { steps: 5600, activeMin: 28, sedentaryHours: 10, workouts: ["walk 30min"] },
    selfReported: { stress: 3, energy: 3, mood: 3, caffeine: "2 coffees (8h, 13h)", alcohol: "none", meals: "3 meals, no late eating", screenBeforeBed: false, notes: "feeling slightly better" },
  },
  {
    date: "2026-04-10",
    sleep: { durationMin: 390, bedTime: "23:30", wakeTime: "06:00", deepMin: 62, remMin: 74, lightMin: 228, awakeMin: 28, efficiency: 0.88, wakeUps: 2 },
    heart: { restingHr: 62, hrvMs: 37 },
    activity: { steps: 6200, activeMin: 35, sedentaryHours: 9, workouts: ["yoga 20min"] },
    selfReported: { stress: 3, energy: 3, mood: 4, caffeine: "1 coffee (8h)", alcohol: "none", meals: "healthy all day", screenBeforeBed: false, notes: "no caffeine after 14h!" },
  },
  // Yesterday — one relapse
  {
    date: "2026-04-10",
    sleep: { durationMin: 354, bedTime: "00:45", wakeTime: "06:39", deepMin: 44, remMin: 60, lightMin: 220, awakeMin: 40, efficiency: 0.82, wakeUps: 3 },
    heart: { restingHr: 65, hrvMs: 31 },
    activity: { steps: 4100, activeMin: 15, sedentaryHours: 12, workouts: [] },
    selfReported: { stress: 4, energy: 2, mood: 3, caffeine: "2 coffees (8h, 15h30)", alcohol: "2 glasses wine", meals: "skipped lunch, large dinner 21h30", screenBeforeBed: true, notes: "relapsed, launch pressure" },
  },
];

export const trends7d: Trends = {
  avgSleepDuration: 348,
  avgHrv: 32,
  hrvTrend: "declining",
  avgRhr: 65,
  rhrTrend: "rising",
  avgSteps: 3900,
  avgDeepSleep: 45,
  deepSleepTrend: "declining",
  avgStress: 4.3,
  stressTrend: "rising",
};

export const trends30d: Trends = {
  avgSleepDuration: 392,
  avgHrv: 41,
  hrvTrend: "declining",
  avgRhr: 59,
  rhrTrend: "rising",
  avgSteps: 5400,
  avgDeepSleep: 62,
  deepSleepTrend: "declining",
  avgStress: 3.1,
  stressTrend: "rising",
};

export const forecast: ForecastDay[] = [
  {
    date: "2026-04-11",
    label: "Today",
    risk: "moderate",
    reason: "HRV at 29ms — 35% below your 45ms baseline. Body is coping, but on the edge.",
  },
  {
    date: "2026-04-12",
    label: "Tomorrow",
    risk: "moderate",
    reason: "Resting HR trending up for 8 days straight. Sleep debt accumulating: 6h behind this week.",
  },
  {
    date: "2026-04-13",
    label: "Thursday",
    risk: "high",
    reason: "If the pattern holds, HRV will drop below 25ms — the threshold where performance crashes and illness risk spikes.",
  },
];

export const weeklyMetrics: WeeklyMetric[] = [
  { label: "Avg Sleep", value: "5h 48m", unit: "", delta: -18, deltaLabel: "vs last week" },
  { label: "Avg HRV", value: "32", unit: "ms", delta: -9, deltaLabel: "vs baseline" },
  { label: "Avg Steps", value: "3,900", unit: "", delta: -1500, deltaLabel: "vs last week" },
  { label: "Avg Stress", value: "4.3", unit: "/5", delta: +1.2, deltaLabel: "vs last week" },
];
