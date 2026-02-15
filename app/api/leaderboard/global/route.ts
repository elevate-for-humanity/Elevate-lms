import { NextRequest, NextResponse } from "next/server";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(_req: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error }: any = await supabase
    .from("global_leaderboard")
    .select("user_id, avg_progress")
    .order("avg_progress", { ascending: false })
    .limit(10);

  if (error) {
    logger.error("global_leaderboard error", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const userIds = data?.map((r) => r.user_id) || [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const profileMap = new Map(
    (profiles || []).map((p) => [p.id, p.full_name || "Learner"])
  );

  const rows =
    data?.map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      name: profileMap.get(row.user_id) || "Learner",
      avgProgress: row.avg_progress,
      isYou: row.user_id === user.id,
    })) || [];

  return NextResponse.json({ leaderboard: rows });
}
