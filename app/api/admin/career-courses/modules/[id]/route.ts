import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction, BULK_ENTITY_ID } from '@/lib/admin/audit-log';

export const dynamic = 'force-dynamic';

async function guardAdmin() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

// PATCH - Update module (script, video_url, etc.)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;
const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await req.json();

    const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    const updateData: any = {};
    
    if (body.script !== undefined) updateData.script = body.script;
    if (body.video_url !== undefined) updateData.video_url = body.video_url;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.duration_minutes !== undefined) updateData.duration_minutes = body.duration_minutes;
    if (body.is_preview !== undefined) updateData.is_preview = body.is_preview;

    const { data, error } = await db
      .from('career_course_modules')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) await logAdminAudit({ action: AdminAction.CAREER_MODULE_UPDATED, actorId: user.id, entityType: 'career_course_modules', entityId: id, metadata: {}, req: request });

    return NextResponse.json({ module: data });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update module' }, { status: 500 });
  }
}
