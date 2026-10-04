import { getSiteStats } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(await getSiteStats(), { headers: { "cache-control": "public, s-maxage=15, stale-while-revalidate=30" } });
}
