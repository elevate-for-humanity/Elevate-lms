import { NextRequest, NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

async function _GET(_req: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error }: any = await supabase
    .from("learning_goals")
    .select("daily_minutes")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    logger.error("learning_goals GET error", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({
    dailyMinutes: data?.daily_minutes ?? 20,
  });
}

async function _POST(req: NextRequest) {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dailyMinutes } = await req.json();

  const value =
    typeof dailyMinutes === "number" && dailyMinutes > 0
      ? Math.min(dailyMinutes, 300) // max 5 hours
      : 20;

  const { error } = await supabase
    .from("learning_goals")
    .upsert(
      {
        user_id: user.id,
        daily_minutes: value,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    logger.error("learning_goals POST error", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  return NextResponse.json({ dailyMinutes: value });
}
export const GET = withApiAudit('/api/student/goals', _GET);
export const POST = withApiAudit('/api/student/goals', _POST);
