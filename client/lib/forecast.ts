// Forecast engine — EWMA smoothing + velocity-damped projection + composite risk scoring.
// All functions are pure (no side effects) for easy testing.

import type { RiskLevel } from "./types";
import type { ThryveScore } from "./thryve-transform";
import type { Trends, DayData } from "./types";

// ---------------------------------------------------------------------------
// Core signal processing
// ---------------------------------------------------------------------------

/**
 * Exponentially Weighted Moving Average.
 * α = 0.3 weights the most recent day ~3× more than 7 days ago,
 * smoothing noise without lagging too far behind true trend changes.
 */
export function ewma(values: number[], alpha = 0.3): number[] {
  if (!values.length) return [];
  const out: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    out.push(alpha * values[i] + (1 - alpha) * out[i - 1]);
  }
  return out;
}

/**
 * Project n days forward using the last observed velocity,
 * dampening acceleration by 50% per day to avoid runaway extrapolation.
 * Output is clamped to [0, 100].
 */
export function projectDays(smoothed: number[], n = 3): number[] {
  const len = smoothed.length;
  if (len < 3) return Array(n).fill(Math.round(smoothed[len - 1] ?? 50));

  const v1 = smoothed[len - 1] - smoothed[len - 2]; // most recent velocity
  const v2 = smoothed[len - 2] - smoothed[len - 3]; // prior velocity
  const acc = v1 - v2;

  const proj: number[] = [];
  let last = smoothed[len - 1];
  let vel = v1;

  for (let i = 0; i < n; i++) {
    vel = vel + acc * 0.5;                         // dampen acceleration
    vel = Math.max(-6, Math.min(6, vel));           // cap velocity at ±6 pts/day
    const next = Math.max(0, Math.min(100, last + vel));
    proj.push(Math.round(next * 10) / 10);
    last = next;
  }
  return proj;
}

// ---------------------------------------------------------------------------
// Composite risk scoring
// ---------------------------------------------------------------------------

/**
 * Weighted composite from Thryve's three ML prediction scores.
 * Sick-leave risk is the dominant burnout predictor; insomnia second;
 * mental health third.
 */
export function compositeScore(
  sickLeave: number,
  insomnia: number,
  mentalHealth: number
): number {
  return Math.round(sickLeave * 0.5 + insomnia * 0.3 + mentalHealth * 0.2);
}

export function scoreToRisk(composite: number): RiskLevel {
  if (composite >= 65) return "high";
  if (composite >= 40) return "moderate";
  return "low";
}

// ---------------------------------------------------------------------------
// Biometric fallback (used when Thryve ML scores are unavailable)
// ---------------------------------------------------------------------------

/**
 * Estimate a 0-100 composite risk proxy purely from raw biometrics.
 * Used when ThryveMainSleepRelatedSickLeavePrediction isn't in the dataset.
 */
function biometricProxy(day: DayData, baselineRhr: number): number {
  const rhrDelta = Math.max(0, day.heart.restingHr - baselineRhr);
  const sleepDeficit = Math.max(0, 480 - day.sleep.durationMin); // vs 8h target
  const deepDeficit = Math.max(0, 60 - day.sleep.deepMin);       // vs 60 min target

  const score =
    rhrDelta * 4 +                        // each bpm above baseline = +4 pts
    (sleepDeficit / 480) * 35 +            // up to 35 pts for full sleep deficit
    (deepDeficit / 60) * 25;              // up to 25 pts for deep sleep deficit

  return Math.min(100, Math.round(score));
}

// ---------------------------------------------------------------------------
// Sleep debt
// ---------------------------------------------------------------------------

/** Accumulated sleep deficit vs. 8h/night target, in minutes, over last n days. */
export function calcSleepDebt(sleepMinutes: number[], target = 480): number {
  return Math.max(0, sleepMinutes.reduce((acc, m) => acc + (target - m), 0));
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface ComputedForecastDay {
  date: string;
  label: string;
  risk: RiskLevel;
  composite: number;
  sickLeave: number;
  insomniaRisk: number;
  mentalHealthRisk: number;
}

export interface ForecastComputed {
  days: ComputedForecastDay[];
  currentScores: {
    sickLeave: number;
    insomniaRisk: number;
    mentalHealthRisk: number;
    composite: number;
  };
  sleepDebtMin: number;
  /** Last 7 smoothed composite values — used to draw the historical sparkline. */
  historicalComposites: number[];
  /** Labels for historical x-axis (last 7 dates). */
  historicalDates: string[];
  dataSource: "thryve-ml" | "biometric-proxy";
}

// ---------------------------------------------------------------------------
// Main compute function
// ---------------------------------------------------------------------------

export function computeForecast(
  thryveScores: ThryveScore[],
  last14Days: DayData[],
  trends7d: Trends,
  trends30d: Trends
): ForecastComputed {
  const today = new Date();

  function futureDate(offsetDays: number): string {
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toISOString().split("T")[0];
  }

  function dayLabel(offsetDays: number): string {
    if (offsetDays === 0) return "Today";
    if (offsetDays === 1) return "Tomorrow";
    const d = new Date(today);
    d.setDate(d.getDate() + offsetDays);
    return d.toLocaleDateString("en-US", { weekday: "long" });
  }

  const sleepHistory = last14Days.map((d) => d.sleep.durationMin);
  const sleepDebtMin = calcSleepDebt(sleepHistory.slice(-7));

  // ── Path A: Thryve ML scores available ──────────────────────────────────
  if (thryveScores.length >= 3) {
    const recent = thryveScores.slice(-14);

    const sickLeaveRaw = recent.map((s) => s.sickLeave);
    const insomniaRaw = recent.map((s) => s.insomniaRisk);
    const mentalRaw = recent.map((s) => s.mentalHealthRisk);

    const sickLeaveSmooth = ewma(sickLeaveRaw);
    const insomniaSmooth = ewma(insomniaRaw);
    const mentalSmooth = ewma(mentalRaw);

    const sickLeaveProj = projectDays(sickLeaveSmooth);
    const insomniaProj = projectDays(insomniaSmooth);
    const mentalProj = projectDays(mentalSmooth);

    const compositeSmooth = sickLeaveSmooth.map((sl, i) =>
      compositeScore(sl, insomniaSmooth[i], mentalSmooth[i])
    );

    const historicalComposites = compositeSmooth.slice(-7);
    const historicalDates = recent.slice(-7).map((s) => s.date);

    const n = sickLeaveSmooth.length - 1;
    const currentScores = {
      sickLeave: Math.round(sickLeaveSmooth[n]),
      insomniaRisk: Math.round(insomniaSmooth[n]),
      mentalHealthRisk: Math.round(mentalSmooth[n]),
      composite: compositeScore(sickLeaveSmooth[n], insomniaSmooth[n], mentalSmooth[n]),
    };

    const days: ComputedForecastDay[] = [0, 1, 2].map((i) => {
      const sl = Math.round(sickLeaveProj[i]);
      const ins = Math.round(insomniaProj[i]);
      const mh = Math.round(mentalProj[i]);
      const comp = compositeScore(sl, ins, mh);
      return {
        date: futureDate(i),
        label: dayLabel(i),
        risk: scoreToRisk(comp),
        composite: comp,
        sickLeave: sl,
        insomniaRisk: ins,
        mentalHealthRisk: mh,
      };
    });

    return { days, currentScores, sleepDebtMin, historicalComposites, historicalDates, dataSource: "thryve-ml" };
  }

  // ── Path B: Biometric proxy fallback ────────────────────────────────────
  const baselineRhr = trends30d.avgRhr || trends7d.avgRhr || 65;

  const proxyRaw = last14Days
    .filter((d) => d.heart.restingHr > 0 || d.sleep.durationMin > 0)
    .map((d) => biometricProxy(d, baselineRhr));

  if (proxyRaw.length < 3) {
    // Last resort: neutral forecast
    const neutral = 30;
    const days: ComputedForecastDay[] = [0, 1, 2].map((i) => ({
      date: futureDate(i),
      label: dayLabel(i),
      risk: "low",
      composite: neutral,
      sickLeave: neutral,
      insomniaRisk: neutral,
      mentalHealthRisk: neutral,
    }));
    return {
      days,
      currentScores: { sickLeave: neutral, insomniaRisk: neutral, mentalHealthRisk: neutral, composite: neutral },
      sleepDebtMin,
      historicalComposites: Array(7).fill(neutral),
      historicalDates: [],
      dataSource: "biometric-proxy",
    };
  }

  const proxySmooth = ewma(proxyRaw);
  const proxyProj = projectDays(proxySmooth);
  const historicalComposites = proxySmooth.slice(-7);
  const historicalDates = last14Days.slice(-7).map((d) => d.date);

  const lastProxy = Math.round(proxySmooth[proxySmooth.length - 1]);
  const currentScores = {
    sickLeave: lastProxy,
    insomniaRisk: lastProxy,
    mentalHealthRisk: lastProxy,
    composite: lastProxy,
  };

  const days: ComputedForecastDay[] = [0, 1, 2].map((i) => {
    const comp = Math.round(proxyProj[i]);
    return {
      date: futureDate(i),
      label: dayLabel(i),
      risk: scoreToRisk(comp),
      composite: comp,
      sickLeave: comp,
      insomniaRisk: comp,
      mentalHealthRisk: comp,
    };
  });

  return { days, currentScores, sleepDebtMin, historicalComposites, historicalDates, dataSource: "biometric-proxy" };
}
