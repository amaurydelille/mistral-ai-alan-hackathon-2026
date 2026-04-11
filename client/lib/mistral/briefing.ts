// Mistral-backed daily briefing narrative.
// Extracted from /app/api/daily-briefing/route.ts so multiple routes
// (the unified /api/overview + any legacy single-view routes) can share it.

import type { DayData, Trends, UserProfile } from "@/lib/types";

export interface BriefingParams {
  profile: UserProfile;
  today: DayData;
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
  riskLevel: string;
  riskComposite: number;
  riskReason: string;
  trends7d: Trends;
}

export interface BriefingResult {
  narrative: string;
  topInsight: string;
  actionTip: string;
}

// Fallback narrative — generated from raw numbers when Mistral is unavailable.
// Note: HRV is not available from Withings — deep sleep is the recovery proxy.
export function buildFallbackBriefing(
  today: DayData,
  sleepDebt7dMin: number,
  riskLevel: string,
  trends7d: Trends
): BriefingResult {
  const sleepH = `${Math.floor(today.sleep.durationMin / 60)}h ${today.sleep.durationMin % 60}m`;
  const avgH = `${Math.floor(trends7d.avgSleepDuration / 60)}h ${trends7d.avgSleepDuration % 60}m`;
  const sleepDelta = today.sleep.durationMin - trends7d.avgSleepDuration;
  const deltaStr =
    sleepDelta >= 0 ? `+${Math.round(sleepDelta)}min` : `${Math.round(sleepDelta)}min`;
  const debtNote =
    sleepDebt7dMin > 60
      ? ` You're carrying ${Math.round(sleepDebt7dMin / 60)}h of sleep debt this week.`
      : " Sleep debt is manageable.";

  const narrative =
    `You slept ${sleepH} last night (${deltaStr} vs your 7-day average of ${avgH}). ` +
    `Resting HR is ${today.heart.restingHr} bpm and today's risk is ${riskLevel}.${debtNote}`;

  const deepDelta = today.sleep.deepMin - trends7d.avgDeepSleep;
  const topInsight =
    Math.abs(deepDelta) > 5
      ? `Deep sleep ${deepDelta > 0 ? "up" : "down"} ${Math.abs(Math.round(deepDelta))}min vs 7-day average — ${deepDelta > 0 ? "solid recovery" : "recovery still lagging"}`
      : `Resting HR ${today.heart.restingHr}bpm vs 7-day avg ${trends7d.avgRhr}bpm`;

  const actionTip =
    riskLevel === "high"
      ? "Aim for bed by 22:30 tonight and cut caffeine after 14:00"
      : riskLevel === "moderate"
      ? "A 10-min walk this afternoon will help lower resting HR and ease stress"
      : "Keep your sleep schedule consistent tonight to maintain your recovery";

  return { narrative, topInsight, actionTip };
}

export async function generateBriefingNarrative(params: BriefingParams): Promise<BriefingResult> {
  const fallback = buildFallbackBriefing(
    params.today,
    params.sleepDebt7dMin,
    params.riskLevel,
    params.trends7d
  );

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return fallback;

  const { profile, today, yesterday, sevenDay, sleepDebt7dMin, riskLevel, riskComposite, riskReason } =
    params;

  const sleepHours = `${Math.floor(today.sleep.durationMin / 60)}h ${today.sleep.durationMin % 60}m`;
  const avgSleepHours = `${Math.floor(sevenDay.avgSleepMin / 60)}h ${sevenDay.avgSleepMin % 60}m`;
  const debtHours = `${Math.floor(sleepDebt7dMin / 60)}h ${sleepDebt7dMin % 60}m`;
  const ySlH = `${Math.floor(yesterday.sleepDurationMin / 60)}h ${yesterday.sleepDurationMin % 60}m`;

  const selfLine = today.selfReported
    ? `\n- Self-reported: stress ${today.selfReported.stress}/5, energy ${today.selfReported.energy}/5, mood ${today.selfReported.mood}/5`
    : "";

  const prompt = `You are a personal health coach for ${profile.name}, ${profile.age}, ${profile.job}.
Generate a short daily morning wellness briefing. Respond ONLY with valid JSON.

Today's biometrics:
- Sleep: ${sleepHours} (deep: ${today.sleep.deepMin}min, efficiency: ${Math.round(today.sleep.efficiency * 100)}%, bed ${today.sleep.bedTime}→${today.sleep.wakeTime})
- Resting HR: ${today.heart.restingHr} bpm
- Steps: ${today.activity.steps} | Active: ${today.activity.activeMin}min${selfLine}

vs yesterday: sleep ${ySlH}, deep ${yesterday.deepSleepMin}min, HR ${yesterday.restingHr}bpm, steps ${yesterday.steps}
7-day averages: sleep ${avgSleepHours}, deep sleep ${sevenDay.avgDeepSleepMin}min, RHR ${sevenDay.avgRhr}bpm, steps ${sevenDay.avgSteps}, stress ${sevenDay.avgStress}/5
7-day sleep debt: ${debtHours}
Today's wellness risk: ${riskLevel} (score ${riskComposite}/100) — ${riskReason}

Return this exact JSON:
{
  "narrative": "2-3 sentences: warm but direct morning briefing, reference actual numbers",
  "topInsight": "≤15 words: the single most notable delta vs recent history",
  "actionTip": "≤15 words: one specific, actionable recommendation for today"
}

Rules: be specific, reference numbers, no generic advice, no hedging.`;

  try {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 400,
      }),
    });

    if (!res.ok) return fallback;

    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    const parsed = JSON.parse(data.choices[0].message.content) as {
      narrative?: string;
      topInsight?: string;
      actionTip?: string;
    };

    if (!parsed.narrative || !parsed.topInsight || !parsed.actionTip) return fallback;

    return {
      narrative: parsed.narrative,
      topInsight: parsed.topInsight,
      actionTip: parsed.actionTip,
    };
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Utility shared with the forecast/overview routes
// ---------------------------------------------------------------------------

export function buildRiskReason(sl: number, ins: number, mh: number): string {
  const max = Math.max(sl, ins, mh);
  if (max === sl) return `Sick-leave risk at ${sl}/100 is the primary driver.`;
  if (max === ins) return `Insomnia risk at ${ins}/100 is the primary driver.`;
  return `Mental health risk at ${mh}/100 is the primary driver.`;
}
