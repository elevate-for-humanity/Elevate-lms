import { NextResponse } from 'next/server';
import { LessonUpdateSchema } from '@/lib/validators/course';
import { getLesson, updateLesson, deleteLesson } from '@/lib/db/courses';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized', status: 401 };
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'super_admin', 'instructor'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return { user, profile };
}

async function _GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const data = await getLesson(id);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    const body = await request.json().catch(() => null);
    const parsed = LessonUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    if (Object.keys(parsed.data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    const data = await updateLesson(id, parsed.data);
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Detect publish/unpublish transitions for targeted audit entries
    const isPublish   = parsed.data.is_published === true  || (parsed.data as any).status === 'published';
    const isUnpublish = parsed.data.is_published === false || (parsed.data as any).status === 'draft';
    const action = isPublish
      ? AdminAction.LESSON_PUBLISHED
      : isUnpublish
        ? AdminAction.LESSON_UNPUBLISHED
        : AdminAction.LESSON_UPDATED;

    await logAdminAudit({
      action,
      actorId:    auth.id,
      entityType: 'course_lessons',
      entityId:   id,
      metadata:   { fields_changed: Object.keys(parsed.data) },
      req:        request,
    });
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function _DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const { id } = await params;
  const auth = await requireAdmin();
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  try {
    // Fetch title before deletion so the audit record is meaningful
    const existing = await getLesson(id);
    const data = await deleteLesson(id);
    await logAdminAudit({
      action:     AdminAction.LESSON_DELETED,
      actorId:    auth.id,
      entityType: 'course_lessons',
      entityId:   id,
      metadata:   { title: (existing as any)?.title ?? 'unknown' },
      req:        request,
    });
    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
export const GET = withApiAudit('/api/admin/lessons/[id]', _GET);
export const PATCH = withApiAudit('/api/admin/lessons/[id]', _PATCH);
export const DELETE = withApiAudit('/api/admin/lessons/[id]', _DELETE);
