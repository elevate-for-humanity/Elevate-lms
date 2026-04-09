import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const dynamic = 'force-dynamic';

async function getAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) return null;
  return user;
}

// PATCH - Update module (script, video_url, etc.)
async function _PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const user = await getAdminUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

    const db = await getAdminClient();
    if (!db) return NextResponse.json({ error: 'Service temporarily unavailable' }, { status: 503 });

    // Pre-read: verify module exists before updating
    const { data: existing, error: fetchError } = await db
      .from('career_course_modules')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Module not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.script !== undefined) updateData.script = body.script;
    if (body.video_url !== undefined) updateData.video_url = body.video_url;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.duration_minutes !== undefined) updateData.duration_minutes = body.duration_minutes;
    if (body.is_preview !== undefined) updateData.is_preview = body.is_preview;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await db
      .from('career_course_modules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    await logAdminAudit({
      action: AdminAction.CAREER_MODULE_UPDATED,
      actorId: user.id,
      entityType: 'career_course_modules',
      entityId: id,
      metadata: {},
      req,
    });

    return NextResponse.json({ module: data });
  } catch {
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 });
  }
}

export const PATCH = withApiAudit('/api/admin/career-courses/modules/[id]', _PATCH as any);
