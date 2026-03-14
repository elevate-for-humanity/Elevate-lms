
import { createAdminClient } from '@/lib/supabase/admin';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { toErrorMessage } from '@/lib/safe';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function parseBody<T>(request: NextRequest): Promise<T> {
  return request.json() as Promise<T>;
}

async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const supabase = getSupabaseServerClient();

  const { data, error }: any = await supabase
    .from("learning_paths")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json(data);
}

async function _POST(request: NextRequest) {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

  const supabase = getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await parseBody<Record<string, any>>(request);
  const { path_id } = body;

  const { data, error }: any = await supabase
    .from("user_learning_paths")
    .insert({
      user_id: user.id,
      path_id,
      current_step: 1,
      progress_percentage: 0,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: toErrorMessage(error) }, { status: 500 });
  }

  return NextResponse.json(data);
}
export const GET = withApiAudit('/api/learning-paths', _GET);
export const POST = withApiAudit('/api/learning-paths', _POST);
