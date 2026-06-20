/**
 * POST /api/admin/learning-paths
 * Creates a new learning path. Admin-only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const { name, description, path_type, difficulty, estimated_weeks, is_featured } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const db = await requireAdminClient();
  const { data, error } = await db
    .from('learning_paths')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      path_type: path_type || 'general',
      difficulty: difficulty || 'beginner',
      estimated_weeks: estimated_weeks || null,
      is_featured: Boolean(is_featured),
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}

export const POST = withApiAudit('/api/admin/learning-paths', _POST);
