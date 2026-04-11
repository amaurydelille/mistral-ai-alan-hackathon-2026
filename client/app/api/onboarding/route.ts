import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export interface OnboardingResult {
  profile: Record<string, unknown>;
  coachReply: string;
}

const FALLBACK: OnboardingResult = {
  profile: {
    goals: ["better sleep", "more energy"],
    key_insight: "Sleep and energy are closely linked",
    coach_reply: "Got it.",
  },
  coachReply:
    "Got it — I've noted your goals. Your data is already loaded. Let me show you what's actually going on.",
};

export async function POST(req: NextRequest) {
  const { message } = (await req.json()) as { message?: string };
  if (!message?.trim()) {
    return Response.json({ error: "message required" }, { status: 400 });
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return Response.json(FALLBACK);

  const prompt = `You are extracting a health profile from a user's onboarding message.

User said: "${message}"

Return a single JSON object with these fields (include only what's relevant or inferable — omit fields that aren't mentioned):
{
  "goals": ["array of specific health/wellness goals, max 3"],
  "main_focus": "their primary concern in 3-5 words",
  "stress_level": "high" | "moderate" | "low",
  "sleep_concern": true | false,
  "energy_concern": true | false,
  "constraints": ["e.g. no gym, busy schedule — only if mentioned"],
  "caffeine": "description if mentioned",
  "alcohol": "description if mentioned",
  "key_insight": "the single most actionable signal in ≤8 words",
  "coach_reply": "1-2 sentences: acknowledge what they said using their actual words, tell them you've loaded their data and can show them exactly what's happening. Warm, direct, no fluff."
}

Be specific. Extract real signals from what they wrote.`;

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
        temperature: 0.2,
        max_tokens: 400,
      }),
    });

    if (!res.ok) return Response.json(FALLBACK);

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
    };
    const parsed = JSON.parse(data.choices[0].message.content) as Record<string, unknown>;

    const { coach_reply, ...profileFields } = parsed;

    return Response.json({
      profile: profileFields,
      coachReply:
        typeof coach_reply === "string" && coach_reply.trim()
          ? coach_reply
          : FALLBACK.coachReply,
    } satisfies OnboardingResult);
  } catch {
    return Response.json(FALLBACK);
  }
}
