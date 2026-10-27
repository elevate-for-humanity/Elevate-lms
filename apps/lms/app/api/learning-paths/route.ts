import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getCurrentUser } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function _GET(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await requireAdminClient();
  const [{ data: paths, error }, { data: skills }] = await Promise.all([
    db
      .from('learning_paths')
      .select(
        'id,name,description,path_type,programs,estimated_weeks,difficulty,is_featured,skills',
      )
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false }),
    db.from('user_skills').select('skill_name,proficiency_level').eq('user_id', user.id),
  ]);
  if (error) return NextResponse.json({ error: 'Learning paths are unavailable' }, { status: 500 });
  return NextResponse.json({ paths: paths ?? [], skills: skills ?? [] });
}

async function _POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'api');
  if (limited) return limited;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const pathId = typeof body.path_id === 'string' ? body.path_id : '';
  if (!UUID.test(pathId)) {
    return NextResponse.json({ error: 'A valid learning path is required' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const { data: path, error: pathError } = await db
    .from('learning_paths')
    .select('id,name,programs')
    .eq('id', pathId)
    .eq('is_active', true)
    .maybeSingle();
  if (pathError)
    return NextResponse.json({ error: 'Unable to verify learning path' }, { status: 500 });
  if (!path) return NextResponse.json({ error: 'Learning path not found' }, { status: 404 });

  const now = new Date().toISOString();
  const { data, error } = await db
    .from('user_learning_paths')
    .upsert(
      {
        user_id: user.id,
        learning_path_id: path.id,
        path_name: path.name,
        modules: path.programs,
        current_step: 1,
        progress: 0,
        progress_percentage: 0,
        status: 'active',
        started_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id,learning_path_id' },
    )
    .select('id,learning_path_id,current_step,progress_percentage,status,started_at')
    .single();
  if (error) return NextResponse.json({ error: 'Unable to start learning path' }, { status: 500 });
  return NextResponse.json(data);
}

export const GET = withApiAudit('/api/learning-paths', _GET);
export const POST = withApiAudit('/api/learning-paths', _POST);
