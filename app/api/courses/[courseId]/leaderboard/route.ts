import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(
  _req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { courseId } = await params;
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error }: any = await supabase
    .from("course_leaderboard")
    .select("user_id, progress_percent")
    .eq("course_id", courseId)
    .order("progress_percent", { ascending: false })
    .limit(10);

  if (error) {
    logger.error("leaderboard error", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  // Optionally join profile names
  const userIds = data?.map((r) => r.user_id) || [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", userIds);

  const nameMap = new Map(
    (profiles || []).map((p) => [p.id, p.full_name || "Learner"])
  );

  const rows = (data || []).map((row, index) => ({
    rank: index + 1,
    userId: row.user_id,
    name: nameMap.get(row.user_id) || "Learner",
    progress: row.progress_percent,
  }));

  return NextResponse.json({ leaderboard: rows });
}
export const GET = withApiAudit('/api/courses/[courseId]/leaderboard', _GET);
