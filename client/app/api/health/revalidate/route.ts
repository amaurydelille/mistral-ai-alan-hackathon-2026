import { revalidateTag } from "next/cache";

export async function POST() {
  revalidateTag("thryve-health", "max");
  return Response.json({ revalidated: true });
}
