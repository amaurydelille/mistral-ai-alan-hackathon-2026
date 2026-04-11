// Unified data endpoint for /overview.
// ONE Thryve fetch → ONE computeForecast → THREE parallel Mistral calls.
// The three Mistral calls each receive the same computed context but a
// different editorial framing (alert / briefing / forecast).

import type { NextRequest } from "next/server";
import { fetchDailyData } from "@/lib/thryve";
import { transformItManager } from "@/lib/thryve-transform";
import {
  computeForecast,
  countConsecutiveBadNights,
  bedtimeConsistencyMin,
  rhrElevation,
   calcSleepDebt,
} from "@/lib/forecast";
import { getDemoIndexFromRequest, getDemoSnapshot } from "@/lib/demo-time";
import { generateBriefingNarrative, buildRiskReason } from "@/lib/mistral/briefing";
import { generateForecastNarrative } from "@/lib/mistral/forecast";
import { generateAlertHeadline } from "@/lib/mistral/alert";
import { supabase } from "@/lib/supabase";
import type { ThryveScore } from "@/lib/thryve-transform";
import type {
  DayData,
  Trends,
  UserProfile,
  ForecastDay,
  ForecastResponse,
  RiskLevel,
  DailyBriefingResponse,
} from "@/lib/types";
import {
  marie,
  today as mockToday,
  last14Days as mockLast14Days,
  trends7d as mockTrends7d,
  trends30d as mockTrends30d,
} from "@/lib/mock-data";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// In-memory cache — one composite entry per (user, day)
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: OverviewResponse;
  expiresAt: number;
}

const overviewCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCached(key: string): OverviewResponse | null {
  const entry = overviewCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    overviewCache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: OverviewResponse): void {
  overviewCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function subtractDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Response shape — superset of the old dashboard + forecast payloads
// ---------------------------------------------------------------------------

export interface OverviewResponse {
  date: string;
  profile: UserProfile;
  today: DayData;
  last14Days: DayData[];
  trends7d: Trends;
  alert: {
    headline: string;
    risk: RiskLevel;
    composite: number;
  };
  briefing: DailyBriefingResponse;
  forecast: ForecastResponse;
  wellnessTrend: number[]; // historical wellness (100-composite) for sparkline
  strokeRisk: number; // 0-100 proxy score derived from RHR elevation + sleep debt
}

interface HealthSnapshot {
  profile: UserProfile;
  today: DayData;
  last14Days: DayData[];
  trends7d: Trends;
  trends30d: Trends;
  thryveScores: ThryveScore[];
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const endUserId = process.env.THRYVE_IT_MANAGER_ID;
  const demoIdx = getDemoIndexFromRequest(request);

  const now = new Date();
  const todayStr = now.toISOString().split("T")[0];

  // Fetch active promise titles — used to personalise the rescue plan prompt
  // and as part of the cache key so adding/removing a promise busts the cache.
  let activePromiseTitles: string[] = [];
  try {
    const { data: goalsData } = await supabase
      .from("goals")
      .select("title")
      .is("archived_at", null);
    activePromiseTitles = (goalsData ?? []).map((r: { title: string }) => r.title);
  } catch {
    // non-fatal — proceed without promise context
  }

  const promisesKey = activePromiseTitles.sort().join("|");
  const cacheKey =
    demoIdx !== null
      ? `demo:${demoIdx}:${promisesKey}`
      : `${endUserId ?? "mock"}:${todayStr}:${promisesKey}`;

  const cached = getCached(cacheKey);
  if (cached) {
    return Response.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  // --- 1. Load health data (Thryve → demo → mock fallback) ----------------
  let health: HealthSnapshot;
  if (demoIdx !== null) {
    health = getDemoSnapshot(demoIdx) as HealthSnapshot;
  } else {
    try {
      if (!endUserId) throw new Error("No THRYVE_IT_MANAGER_ID");
      const endDay = todayStr;
      const startDay = subtractDays(now, 30);
      const raw = await fetchDailyData(endUserId, startDay, endDay);
      health = transformItManager(raw) as HealthSnapshot;
    } catch {
      health = {
        profile: marie,
        today: mockToday,
        last14Days: mockLast14Days,
        trends7d: mockTrends7d,
        trends30d: mockTrends30d,
        thryveScores: [],
      };
    }
  }

  const { profile, today, last14Days, trends7d, trends30d, thryveScores } = health;

  // --- 2. Single forecast + derived signals -------------------------------
  const computed = computeForecast(thryveScores, last14Days, trends7d, trends30d);
  const todayForecast = computed.days[0];
  const avgSleep30d = trends30d.avgSleepDuration || trends7d.avgSleepDuration;
  const streak = countConsecutiveBadNights(last14Days, avgSleep30d);
  const bedtimeVarianceMin = bedtimeConsistencyMin(last14Days.map((d) => d.sleep.bedTime));
  const rhrElevationBpm = rhrElevation(trends7d.avgRhr, trends30d.avgRhr);
  const sleepDebt7dMin = calcSleepDebt(last14Days.slice(-7).map((d) => d.sleep.durationMin));

  // Proxy stroke risk: RHR elevation drives cardiovascular load; sleep debt
  // impairs vascular recovery. Formula tuned so Amaury's spiral scores ~34/100.
  const baselineRhr = profile.baselineRhr || trends30d.avgRhr;
  const rhrDelta = trends7d.avgRhr - baselineRhr;
  const strokeRisk = Math.round(
    Math.min(100, Math.max(0,
      Math.max(0, rhrDelta) * 2 +
      Math.max(0, sleepDebt7dMin / 60 - 1) * 3
    ))
  );

  // --- 3. Yesterday + briefing context -----------------------------------
  const yd = last14Days[last14Days.length - 1];
  const yesterday = {
    sleepDurationMin: yd?.sleep.durationMin ?? 0,
    deepSleepMin: yd?.sleep.deepMin ?? 0,
    restingHr: yd?.heart.restingHr ?? 0,
    steps: yd?.activity.steps ?? 0,
  };

  const riskReason = buildRiskReason(
    todayForecast.sickLeave,
    todayForecast.insomniaRisk,
    todayForecast.mentalHealthRisk
  );

  // --- 4. THREE parallel Mistral calls ------------------------------------
  const topDriverScore = Math.max(
    todayForecast.sickLeave,
    todayForecast.insomniaRisk,
    todayForecast.mentalHealthRisk
  );
  const topDriver: "sick-leave" | "insomnia" | "mental-health" =
    topDriverScore === todayForecast.sickLeave
      ? "sick-leave"
      : topDriverScore === todayForecast.insomniaRisk
      ? "insomnia"
      : "mental-health";

  const [alertResult, briefingResult, forecastResult] = await Promise.all([
    generateAlertHeadline({
      riskLevel: todayForecast.risk,
      composite: todayForecast.composite,
      sleepDebtMin: computed.sleepDebtMin,
      consecutiveBadNights: streak,
      rhrElevationBpm,
      todaySleepMin: today.sleep.durationMin,
      avgSleepMin7d: trends7d.avgSleepDuration,
      topDriver,
      topDriverScore,
    }),
    generateBriefingNarrative({
      profile,
      today,
      yesterday,
      sevenDay: {
        avgSleepMin: trends7d.avgSleepDuration,
        avgDeepSleepMin: trends7d.avgDeepSleep,
        avgRhr: trends7d.avgRhr,
        avgSteps: trends7d.avgSteps,
        avgStress: trends7d.avgStress,
      },
      sleepDebt7dMin,
      riskLevel: todayForecast.risk,
      riskComposite: todayForecast.composite,
      riskReason,
      trends7d,
    }),
    generateForecastNarrative(computed.days, {
      avgRhr: trends7d.avgRhr,
      rhrTrend: trends7d.rhrTrend,
      avgSleepMin: trends7d.avgSleepDuration,
      deepSleepTrend: trends7d.deepSleepTrend,
      sleepDebtMin: computed.sleepDebtMin,
      currentSickLeave: computed.currentScores.sickLeave,
      currentInsomnia: computed.currentScores.insomniaRisk,
      currentMentalHealth: computed.currentScores.mentalHealthRisk,
      consecutiveBadNights: streak,
      bedtimeVarianceMin,
      rhrElevationBpm,
      projectionBias: computed.projectionBias,
      activePromises: activePromiseTitles,
    }),
  ]);

  // --- 5. Assemble response -----------------------------------------------
  const forecastDays: ForecastDay[] = computed.days.map((d, i) => ({
    date: d.date,
    label: d.label,
    risk: d.risk,
    reason: forecastResult.reasons[i] ?? `${d.risk} risk based on current trend.`,
    composite: d.composite,
    sickLeave: d.sickLeave,
    insomniaRisk: d.insomniaRisk,
    mentalHealthRisk: d.mentalHealthRisk,
  }));

  const wellnessTrend = computed.historicalComposites.map((c) => Math.round(100 - c));

  const briefingResponse: DailyBriefingResponse = {
    date: todayStr,
    today: {
      sleepDurationMin: today.sleep.durationMin,
      deepSleepMin: today.sleep.deepMin,
      sleepEfficiency: today.sleep.efficiency,
      bedTime: today.sleep.bedTime,
      wakeTime: today.sleep.wakeTime,
      restingHr: today.heart.restingHr,
      steps: today.activity.steps,
      activeMin: today.activity.activeMin,
      stress: today.selfReported.stress,
      energy: today.selfReported.energy,
      mood: today.selfReported.mood,
    },
    past: {
      yesterday,
      sevenDay: {
        avgSleepMin: trends7d.avgSleepDuration,
        avgDeepSleepMin: trends7d.avgDeepSleep,
        avgRhr: trends7d.avgRhr,
        avgSteps: trends7d.avgSteps,
        avgStress: trends7d.avgStress,
      },
      sleepDebt7dMin,
    },
    todayRisk: {
      level: todayForecast.risk,
      composite: todayForecast.composite,
      reason: riskReason,
    },
    narrative: briefingResult.narrative,
    topInsight: briefingResult.topInsight,
    actionTip: briefingResult.actionTip,
  };

  const forecastResponse: ForecastResponse = {
    forecast: forecastDays,
    rescuePlan: forecastResult.rescuePlan,
    computed: {
      currentScores: computed.currentScores,
      sleepDebtMin: computed.sleepDebtMin,
      historicalComposites: computed.historicalComposites,
      historicalDates: computed.historicalDates,
      dataSource: computed.dataSource,
      insights: computed.insights,
    },
  };

  const response: OverviewResponse = {
    date: todayStr,
    profile,
    today,
    last14Days,
    trends7d,
    alert: {
      headline: alertResult.headline,
      risk: todayForecast.risk,
      composite: todayForecast.composite,
    },
    briefing: briefingResponse,
    forecast: forecastResponse,
    wellnessTrend,
    strokeRisk,
  };

  setCache(cacheKey, response);
  return Response.json(response, { headers: { "X-Cache": "MISS" } });
}
