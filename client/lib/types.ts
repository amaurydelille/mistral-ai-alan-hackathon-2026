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
  };
}

export interface WeeklyMetric {
  label: string;
  value: string;
  unit: string;
  delta: number;
  deltaLabel: string;
}
