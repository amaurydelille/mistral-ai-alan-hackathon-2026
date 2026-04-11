import type { NextRequest } from "next/server";
import { fetchDailyData } from "@/lib/thryve";
import { transformItManager } from "@/lib/thryve-transform";

// Always fetch fresh — health data changes daily.
export const dynamic = "force-dynamic";

function subtractDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
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
    const raw = await fetchDailyData(endUserId, startDay, endDay);
    const data = transformItManager(raw);
    return Response.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
