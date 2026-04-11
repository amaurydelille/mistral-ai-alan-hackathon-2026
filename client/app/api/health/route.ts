import type { NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { fetchDailyData } from "@/lib/thryve";
import { transformItManager } from "@/lib/thryve-transform";
import { getDemoIndexFromRequest, getDemoSnapshot } from "@/lib/demo-time";

function subtractDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split("T")[0];
}

const getCachedHealth = unstable_cache(
  async (endUserId: string, startDay: string, endDay: string) => {
    const raw = await fetchDailyData(endUserId, startDay, endDay);
    return transformItManager(raw);
  },
  ["thryve-health"],
  { revalidate: 3600, tags: ["thryve-health"] }
);

export async function GET(request: NextRequest) {
  // Demo mode: bypass Thryve, return mock slice for the given day index
  const demoIdx = getDemoIndexFromRequest(request);
  if (demoIdx !== null) {
    return Response.json(getDemoSnapshot(demoIdx));
  }

  const endUserId = process.env.THRYVE_IT_MANAGER_ID;
  if (!endUserId) {
    return Response.json({ error: "THRYVE_IT_MANAGER_ID not configured" }, { status: 500 });
  }

  const searchParams = request.nextUrl.searchParams;
  const days = Math.min(365, Math.max(7, Number(searchParams.get("days") ?? "28")));

  const today = new Date();
  const endDay = today.toISOString().split("T")[0];
  const startDay = subtractDays(today, days);

  try {
    const data = await getCachedHealth(endUserId, startDay, endDay);
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
