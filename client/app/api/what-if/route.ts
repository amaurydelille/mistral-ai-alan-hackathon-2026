import type { NextRequest } from "next/server";
import { fetchDailyData } from "@/lib/thryve";
import { transformItManager } from "@/lib/thryve-transform";
import type { HealthData } from "@/lib/thryve-transform";
import {
  buildPrompt,
  normalisedCacheKey,
  type ChatResponse,
  type HistoryEntry,
} from "@/lib/what-if";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Layer 1 — health context cache (1h TTL)
// ---------------------------------------------------------------------------

interface HealthEntry { data: HealthData; expiresAt: number }
const healthCache = new Map<string, HealthEntry>();

async function getHealthContext(userId: string): Promise<HealthData> {
  const today = new Date().toISOString().split("T")[0];
  const key = `health:${userId}:${today}`;
  const hit = healthCache.get(key);
  if (hit && Date.now() < hit.expiresAt) return hit.data;

  const end = today;
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 30);

  const raw = await fetchDailyData(userId, start.toISOString().split("T")[0], end);
  const data = transformItManager(raw);
  healthCache.set(key, { data, expiresAt: Date.now() + 60 * 60 * 1000 });
  return data;
}

// ---------------------------------------------------------------------------
// Layer 2 — response cache (2h TTL, standalone questions only)
// ---------------------------------------------------------------------------

interface ResponseEntry { data: ChatResponse; expiresAt: number }
const responseCache = new Map<string, ResponseEntry>();

function getResponseCache(key: string): ChatResponse | null {
  const hit = responseCache.get(key);
  if (!hit || Date.now() > hit.expiresAt) { responseCache.delete(key); return null; }
  return hit.data;
}
function setResponseCache(key: string, data: ChatResponse): void {
  responseCache.set(key, { data, expiresAt: Date.now() + 2 * 60 * 60 * 1000 });
}

// ---------------------------------------------------------------------------
// Mistral call
// ---------------------------------------------------------------------------

const FALLBACK: ChatResponse = {
  isFollowUp: false,
  text: "I couldn't reach the AI model right now. Please try again in a moment.",
};

async function callMistral(
  question: string,
  health: HealthData,
  history: HistoryEntry[]
): Promise<ChatResponse> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) return FALLBACK;

  const prompt = buildPrompt(question, health, history);

  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "mistral-large-latest",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) return FALLBACK;

  try {
    const raw = await res.json() as { choices: { message: { content: string } }[] };
    const parsed = JSON.parse(raw.choices[0].message.content) as ChatResponse;
    if (!parsed.text) return FALLBACK;
    return parsed;
  } catch {
    return FALLBACK;
  }
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

interface Body { question: string; history?: HistoryEntry[] }

export async function POST(req: NextRequest) {
  const userId = process.env.THRYVE_IT_MANAGER_ID;
  if (!userId) return Response.json({ error: "THRYVE_IT_MANAGER_ID not set" }, { status: 500 });

  let body: Body;
  try { body = await req.json() as Body; }
  catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

  const { question, history = [] } = body;
  if (!question?.trim()) return Response.json({ error: "question required" }, { status: 400 });

  const today = new Date().toISOString().split("T")[0];
  const isStandalone = history.length === 0;
  const cacheKey = normalisedCacheKey(userId, question, today);

  if (isStandalone) {
    const cached = getResponseCache(cacheKey);
    if (cached) return Response.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  try {
    const health = await getHealthContext(userId);
    const response = await callMistral(question, health, history);
    if (isStandalone) setResponseCache(cacheKey, response);
    return Response.json(response, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
