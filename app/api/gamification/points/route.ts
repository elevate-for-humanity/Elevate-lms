
import { createAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function parseBody<T>(request: NextRequest): Promise<T> {
  return request.json() as Promise<T>;
}

async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: userPoints } = await supabase
    .from("user_points")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!userPoints) {
    const { data: newPoints } = await supabase
      .from("user_points")
      .insert({
        user_id: user.id,
        total_points: 0,
        level: 1,
        level_name: "Beginner",
        points_to_next_level: 100,
      })
      .select()
      .single();

    return NextResponse.json(newPoints);
  }

  return NextResponse.json(userPoints);
}

async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseBody<Record<string, any>>(request);
  const { points, action_type, description, reference_id, reference_type } = body;

  await supabase.from("point_transactions").insert({
    user_id: user.id,
    points,
    action_type,
    description,
    reference_id,
    reference_type,
  });

  const { data: currentPoints } = await supabase
    .from("user_points")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const newTotal = (currentPoints?.total_points || 0) + points;
  const newLevel = Math.floor(newTotal / 1000) + 1;
  const levelName = newLevel === 1 ? "Beginner" : newLevel <= 5 ? "Intermediate" : "Advanced";
  const pointsToNext = 1000 - (newTotal % 1000);

  const { data: updatedPoints } = await supabase
    .from("user_points")
    .update({
      total_points: newTotal,
      level: newLevel,
      level_name: levelName,
      points_to_next_level: pointsToNext,
    })
    .eq("user_id", user.id)
    .select()
    .single();

  return NextResponse.json(updatedPoints);
}
export const GET = withApiAudit('/api/gamification/points', _GET);
export const POST = withApiAudit('/api/gamification/points', _POST);
