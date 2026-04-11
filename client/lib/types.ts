// Core data types — defined as a contract so swapping mock → Thrive API
// is a one-liner in mock-data.ts (just replace the exported values).

export type RiskLevel = "low" | "moderate" | "high";

export interface UserProfile {
  name: string;
  age: number;
  job: string;
  goals: string[];
  constraints: string[];
  baselineHrv: number;
  baselineRhr: number;
}

export interface SleepData {
  durationMin: number;
  bedTime: string;
  wakeTime: string;
  deepMin: number;
  remMin: number;
  lightMin: number;
  awakeMin: number;
  efficiency: number;
  wakeUps: number;
}

export interface HeartData {
  restingHr: number;
  hrvMs: number;
}

export interface ActivityData {
  steps: number;
  activeMin: number;
  sedentaryHours: number;
  workouts: string[];
  burnedCalories?: number;   // total kcal (BMR + active)
  activeCal?: number;        // active kcal only
  hrZoneLightMin?: number;   // minutes in light HR zone
  hrZoneModerateMin?: number; // minutes in moderate HR zone
}

export interface SelfReported {
  stress: number;
  energy: number;
  mood: number;
  caffeine: string;
  alcohol: string;
  meals: string;
  screenBeforeBed: boolean;
  notes: string;
}

export interface DayData {
  date: string;
  sleep: SleepData;
  heart: HeartData;
  activity: ActivityData;
  selfReported: SelfReported;
}

export interface Trends {
  avgSleepDuration: number;
  avgHrv: number;
  hrvTrend: "declining" | "stable" | "improving";
  avgRhr: number;
  rhrTrend: "rising" | "stable" | "declining";
  avgSteps: number;
  avgDeepSleep: number;
  deepSleepTrend: "declining" | "stable" | "improving";
  avgStress: number;
  stressTrend: "rising" | "stable" | "declining";
}

export interface ForecastDay {
  date: string;
  label: string;
  risk: RiskLevel;
  reason: string;
  composite?: number;
  sickLeave?: number;
  insomniaRisk?: number;
  mentalHealthRisk?: number;
}

export interface RescuePlanStep {
  step: number;
  action: string;
  why: string;
}

export interface ForecastInsight {
  id: string;
  level: "ok" | "warn" | "alert";
  title: string;
  description: string;
  value: string;
}

export interface ForecastResponse {
  forecast: ForecastDay[];
  rescuePlan: RescuePlanStep[];
  computed: {
    currentScores: {
      sickLeave: number;
      insomniaRisk: number;
      mentalHealthRisk: number;
      composite: number;
    };
    sleepDebtMin: number;
    historicalComposites: number[];
    historicalDates: string[];
    dataSource: "thryve-ml" | "biometric-proxy";
    insights: ForecastInsight[];
  };
}

// ---------------------------------------------------------------------------
// Goals
// ---------------------------------------------------------------------------

export type GoalMetric =
  | "sleep_duration_min"
  | "deep_sleep_min"
  | "steps"
  | "active_min"
  | "resting_hr"
  | "sedentary_hours"
  | "avg_stress"
  | "abstract";

export type GoalType = "metric" | "abstract";

export type GoalTimeframe = "1d" | "7d";
export type GoalSource = "ai" | "user";
export type GoalStatus = "achieved" | "on-track" | "at-risk" | "off-track";
export type GoalSentiment = "encouragement" | "warning";

export interface Goal {
  id: string;
  title: string;
  goalType: GoalType;
  /** Free-form description for abstract goals (e.g. "No caffeine after 4pm") */
  description: string | null;
  metric: GoalMetric;
  comparator: "gte" | "lte";
  target: number;
  unit: string;
  timeframe: GoalTimeframe;
  source: GoalSource;
  rationale: string | null;
  isPrimary: boolean;
  createdAt: string;
  archivedAt: string | null;
}

export interface GoalProgress {
  goalId: string;
  currentValue: number;
  percentComplete: number;
  status: GoalStatus;
  sentiment: GoalSentiment;
  message: string;
  evaluatedAt: string;
}

export interface GoalWithProgress {
  goal: Goal;
  progress: Omit<GoalProgress, "message" | "sentiment" | "evaluatedAt">;
}

export interface WeeklyMetric {
  label: string;
  value: string;
  unit: string;
  delta: number;
  deltaLabel: string;
}

export interface DailyBriefingResponse {
  date: string;
  today: {
    sleepDurationMin: number;
    deepSleepMin: number;
    sleepEfficiency: number;
    bedTime: string;
    wakeTime: string;
    restingHr: number;
    steps: number;
    activeMin: number;
    stress?: number;
    energy?: number;
    mood?: number;
  };
  past: {
    yesterday: {
      sleepDurationMin: number;
      deepSleepMin: number;
      restingHr: number;
      steps: number;
    };
    sevenDay: {
      avgSleepMin: number;
      avgDeepSleepMin: number;
      avgRhr: number;
      avgSteps: number;
      avgStress: number;
    };
    sleepDebt7dMin: number;
  };
  todayRisk: {
    level: RiskLevel;
    composite: number;
    reason: string;
  };
  narrative: string;
  topInsight: string;
  actionTip: string;
}
