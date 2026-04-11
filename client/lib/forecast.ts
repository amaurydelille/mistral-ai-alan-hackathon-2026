// Forecast engine — EWMA smoothing + velocity-damped projection + composite risk scoring.
// All functions are pure (no side effects) for easy testing.

import type { RiskLevel, ForecastInsight } from "./types";
import type { ThryveScore } from "./thryve-transform";
import type { Trends, DayData } from "./types";

// ---------------------------------------------------------------------------
// Winsorisation — clamp outliers before EWMA so one bad night
// doesn't distort the trend for the following week.
// ---------------------------------------------------------------------------

function winsorise(values: number[]): number[] {
  if (values.length < 4) return values;
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)];
  const q3 = sorted[Math.floor(sorted.length * 0.75)];
  const iqr = q3 - q1;
  const lo = Math.max(0, q1 - 1.5 * iqr);
  const hi = Math.min(100, q3 + 1.5 * iqr);
  return values.map((v) => Math.max(lo, Math.min(hi, v)));
}

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
 * An optional upward bias (from sleep debt, streak, or RHR elevation)
 * is added to each projected point.
 */
export function projectDays(smoothed: number[], n = 3, bias = 0): number[] {
  const len = smoothed.length;
  if (len < 3) return Array(n).fill(Math.round(Math.min(100, (smoothed[len - 1] ?? 50) + bias)));

  const v1 = smoothed[len - 1] - smoothed[len - 2];
  const v2 = smoothed[len - 2] - smoothed[len - 3];
  const acc = v1 - v2;

  const proj: number[] = [];
  let last = smoothed[len - 1];
  let vel = v1;

  for (let i = 0; i < n; i++) {
    vel = vel + acc * 0.5;
    vel = Math.max(-6, Math.min(6, vel));
    const next = Math.max(0, Math.min(100, last + vel + bias));
    proj.push(Math.round(next * 10) / 10);
    last = next;
  }
  return proj;
}

// ---------------------------------------------------------------------------
// Composite risk scoring
// ---------------------------------------------------------------------------

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
// Sleep debt
// ---------------------------------------------------------------------------

export function calcSleepDebt(sleepMinutes: number[], target = 480): number {
  return Math.max(0, sleepMinutes.reduce((acc, m) => acc + (target - m), 0));
}

// ---------------------------------------------------------------------------
// New signals
// ---------------------------------------------------------------------------

/**
 * Count how many consecutive recent nights were below 85% of the user's
 * average sleep duration. A streak of 3+ compounds fatigue non-linearly.
 */
export function countConsecutiveBadNights(days: DayData[], avgDuration: number): number {
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    const dur = days[i].sleep.durationMin;
    if (dur === 0) continue; // no data — don't break the streak
    if (dur < avgDuration * 0.85) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Standard deviation of bedtime in minutes — measures schedule regularity.
 * Bedtimes before 6 AM are treated as post-midnight (add 24h) to handle
 * the common pattern of going to bed around 22:00–01:00.
 */
export function bedtimeConsistencyMin(bedTimes: string[]): number {
  const valid = bedTimes.filter((t) => t && t !== "00:00");
  if (valid.length < 3) return 0;

  const mins = valid.map((t) => {
    const [h, m] = t.split(":").map(Number);
    const total = h * 60 + m;
    return total < 360 ? total + 1440 : total; // before 6 AM → treat as after midnight
  });

  const mean = mins.reduce((a, b) => a + b, 0) / mins.length;
  const variance = mins.reduce((acc, m) => acc + (m - mean) ** 2, 0) / mins.length;
  return Math.round(Math.sqrt(variance));
}

/**
 * How far RHR is above the 30-day personal baseline.
 * ≥ 5 bpm elevation is a known indicator of physiological stress or incoming illness.
 */
export function rhrElevation(avgRhr7d: number, avgRhr30d: number): number {
  if (!avgRhr30d) return 0;
  return Math.max(0, Math.round(avgRhr7d - avgRhr30d));
}

// ---------------------------------------------------------------------------
// Projection bias — quantifies how much the signals push risk upward
// ---------------------------------------------------------------------------

export function computeProjectionBias(
  sleepDebtMin: number,
  consecutiveBadNights: number,
  rhrDelta: number
): number {
  // Sleep debt: every 120 min of debt above the first hour adds ~3 pts, max +8
  const debtBias = sleepDebtMin > 120
    ? Math.min(8, ((sleepDebtMin - 120) / 120) * 3)
    : 0;

  // Streak: from night 2 onward, each additional bad night adds 4 pts, max +12
  const streakBias = consecutiveBadNights >= 2
    ? Math.min(12, (consecutiveBadNights - 1) * 4)
    : 0;

  // RHR: above 4 bpm, each extra bpm adds 2 pts, max +10
  const rhrBias = rhrDelta >= 5
    ? Math.min(10, (rhrDelta - 4) * 2)
    : 0;

  return Math.round(debtBias + streakBias + rhrBias);
}

// ---------------------------------------------------------------------------
// Plain-language insights
// ---------------------------------------------------------------------------

export function buildInsights(
  sleepDebtMin: number,
  streak: number,
  bedtimeStddev: number,
  rhrDelta: number,
  avgSleepMin: number
): ForecastInsight[] {
  const insights: ForecastInsight[] = [];

  // 1. Sleep debt
  const debtH = Math.floor(sleepDebtMin / 60);
  const debtM = sleepDebtMin % 60;
  const debtLabel = debtH > 0 ? `${debtH}h ${debtM}m deficit` : `${debtM}m deficit`;
  if (sleepDebtMin >= 180) {
    insights.push({
      id: "sleep_debt",
      level: "alert",
      title: "High sleep debt this week",
      description: `You've accumulated over ${debtH} hours of deficit against your sleep target. Sustained debt at this level measurably impairs focus, reaction time, and immune resilience.`,
      value: debtLabel,
    });
  } else if (sleepDebtMin >= 60) {
    insights.push({
      id: "sleep_debt",
      level: "warn",
      title: "Sleep debt building",
      description: "You're sleeping less than your body needs across the week. The deficit carries forward — one long night won't fully repay it.",
      value: debtLabel,
    });
  } else {
    insights.push({
      id: "sleep_debt",
      level: "ok",
      title: "Sleep debt under control",
      description: "You're roughly meeting your sleep needs this week. Keep the schedule consistent.",
      value: debtLabel,
    });
  }

  // 2. Consecutive bad nights
  if (streak >= 3) {
    insights.push({
      id: "streak",
      level: "alert",
      title: `${streak} nights in a row below average`,
      description: "Fatigue compounds — recovery from 3+ short nights takes longer than a single catch-up sleep. Your body is in deficit mode.",
      value: `${streak}-night streak`,
    });
  } else if (streak === 2) {
    insights.push({
      id: "streak",
      level: "warn",
      title: "2 consecutive short nights",
      description: "Two nights below your average in a row. Tonight matters — catching up now costs less than waiting.",
      value: "2-night streak",
    });
  }

  // 3. Bedtime consistency
  const avgSleepH = `${Math.floor(avgSleepMin / 60)}h ${avgSleepMin % 60}m`;
  if (bedtimeStddev >= 45) {
    insights.push({
      id: "bedtime",
      level: "alert",
      title: "Irregular sleep schedule",
      description: `Your bedtime shifts by ±${bedtimeStddev} minutes night to night. Irregular timing disrupts your circadian rhythm even when total sleep looks adequate.`,
      value: `±${bedtimeStddev}m variance`,
    });
  } else if (bedtimeStddev >= 20) {
    insights.push({
      id: "bedtime",
      level: "warn",
      title: "Bedtime slightly inconsistent",
      description: `Your bedtime varies by about ${bedtimeStddev} minutes. Locking in a consistent window (±15 min) would improve sleep quality without needing more hours.`,
      value: `±${bedtimeStddev}m variance`,
    });
  } else if (bedtimeStddev > 0) {
    insights.push({
      id: "bedtime",
      level: "ok",
      title: "Consistent sleep schedule",
      description: `Your bedtime is stable within ±${bedtimeStddev} minutes. Regular timing is one of the highest-leverage sleep habits.`,
      value: `±${bedtimeStddev}m variance`,
    });
  }

  // 4. RHR elevation
  if (rhrDelta >= 5) {
    insights.push({
      id: "rhr",
      level: "alert",
      title: "Resting heart rate elevated",
      description: `Your 7-day average RHR is ${rhrDelta} bpm above your 30-day baseline. This typically signals accumulated stress, under-recovery, or an incoming illness — independent of how sleep looks.`,
      value: `+${rhrDelta} bpm above baseline`,
    });
  } else if (rhrDelta >= 3) {
    insights.push({
      id: "rhr",
      level: "warn",
      title: "Resting heart rate slightly up",
      description: `Your RHR is ${rhrDelta} bpm above your personal baseline. Worth watching — it often precedes more visible fatigue symptoms by 1–2 days.`,
      value: `+${rhrDelta} bpm above baseline`,
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Biometric fallback (used when Thryve ML scores are unavailable)
// ---------------------------------------------------------------------------

function biometricProxy(day: DayData, baselineRhr: number): number {
  const rhrDelta = Math.max(0, day.heart.restingHr - baselineRhr);
  const sleepDeficit = Math.max(0, 480 - day.sleep.durationMin);
  const deepDeficit = Math.max(0, 60 - day.sleep.deepMin);

  const score =
    rhrDelta * 4 +
    (sleepDeficit / 480) * 35 +
    (deepDeficit / 60) * 25;

  return Math.min(100, Math.round(score));
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
  historicalComposites: number[];
  historicalDates: string[];
  dataSource: "thryve-ml" | "biometric-proxy";
  insights: ForecastInsight[];
  projectionBias: number; // for passing to Mistral context
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

  // Compute new signals
  const avgSleep = trends30d.avgSleepDuration || trends7d.avgSleepDuration || 420;
  const streak = countConsecutiveBadNights(last14Days, avgSleep);
  const bedtimes = last14Days.map((d) => d.sleep.bedTime);
  const bedtimeStddev = bedtimeConsistencyMin(bedtimes);
  const rhrDelta = rhrElevation(trends7d.avgRhr, trends30d.avgRhr);
  const bias = computeProjectionBias(sleepDebtMin, streak, rhrDelta);

  const insights = buildInsights(sleepDebtMin, streak, bedtimeStddev, rhrDelta, trends7d.avgSleepDuration);

  // ── Path A: Thryve ML scores available ──────────────────────────────────
  if (thryveScores.length >= 3) {
    const recent = thryveScores.slice(-14);

    const sickLeaveSmooth  = ewma(winsorise(recent.map((s) => s.sickLeave)));
    const insomniaSmooth   = ewma(winsorise(recent.map((s) => s.insomniaRisk)));
    const mentalSmooth     = ewma(winsorise(recent.map((s) => s.mentalHealthRisk)));

    const sickLeaveProj = projectDays(sickLeaveSmooth, 3, bias * 0.5);
    const insomniaProj  = projectDays(insomniaSmooth,  3, bias * 0.3);
    const mentalProj    = projectDays(mentalSmooth,    3, bias * 0.2);

    const compositeSmooth = sickLeaveSmooth.map((sl, i) =>
      compositeScore(sl, insomniaSmooth[i], mentalSmooth[i])
    );

    const historicalComposites = compositeSmooth.slice(-7);
    const historicalDates = recent.slice(-7).map((s) => s.date);

    const n = sickLeaveSmooth.length - 1;
    const currentScores = {
      sickLeave:       Math.round(sickLeaveSmooth[n]),
      insomniaRisk:    Math.round(insomniaSmooth[n]),
      mentalHealthRisk: Math.round(mentalSmooth[n]),
      composite: compositeScore(sickLeaveSmooth[n], insomniaSmooth[n], mentalSmooth[n]),
    };

    const days: ComputedForecastDay[] = [0, 1, 2].map((i) => {
      const sl  = Math.round(sickLeaveProj[i]);
      const ins = Math.round(insomniaProj[i]);
      const mh  = Math.round(mentalProj[i]);
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

    return { days, currentScores, sleepDebtMin, historicalComposites, historicalDates, dataSource: "thryve-ml", insights, projectionBias: bias };
  }

  // ── Path B: Biometric proxy fallback ────────────────────────────────────
  const baselineRhr = trends30d.avgRhr || trends7d.avgRhr || 65;

  const proxyRaw = last14Days
    .filter((d) => d.heart.restingHr > 0 || d.sleep.durationMin > 0)
    .map((d) => biometricProxy(d, baselineRhr));

  if (proxyRaw.length < 3) {
    const neutral = 30;
    const days: ComputedForecastDay[] = [0, 1, 2].map((i) => ({
      date: futureDate(i), label: dayLabel(i), risk: "low",
      composite: neutral, sickLeave: neutral, insomniaRisk: neutral, mentalHealthRisk: neutral,
    }));
    return {
      days,
      currentScores: { sickLeave: neutral, insomniaRisk: neutral, mentalHealthRisk: neutral, composite: neutral },
      sleepDebtMin, historicalComposites: Array(7).fill(neutral), historicalDates: [],
      dataSource: "biometric-proxy", insights, projectionBias: bias,
    };
  }

  const proxySmooth = ewma(winsorise(proxyRaw));
  const proxyProj   = projectDays(proxySmooth, 3, bias);
  const historicalComposites = proxySmooth.slice(-7);
  const historicalDates = last14Days.slice(-7).map((d) => d.date);

  const lastProxy = Math.round(proxySmooth[proxySmooth.length - 1]);
  const currentScores = {
    sickLeave: lastProxy, insomniaRisk: lastProxy, mentalHealthRisk: lastProxy, composite: lastProxy,
  };

  const days: ComputedForecastDay[] = [0, 1, 2].map((i) => {
    const comp = Math.round(proxyProj[i]);
    return {
      date: futureDate(i), label: dayLabel(i), risk: scoreToRisk(comp),
      composite: comp, sickLeave: comp, insomniaRisk: comp, mentalHealthRisk: comp,
    };
  });

  return { days, currentScores, sleepDebtMin, historicalComposites, historicalDates, dataSource: "biometric-proxy", insights, projectionBias: bias };
}
