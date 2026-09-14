import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { verifyPortalPreviewHandoff } from '@/lib/admin/portal-preview-handoff';
import { COURSE_PREVIEW_COOKIE } from '@/lib/admin/course-preview';

const ADMIN_ROLES = new Set(['admin', 'super_admin', 'staff']);

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('handoff') || '';
  const handoff = verifyPortalPreviewHandoff(token);
  if (!handoff) return NextResponse.json({ error: 'Invalid preview handoff' }, { status: 403 });
  const db = await requireAdminClient();
  const [{ data: actor }, { data: course }] = await Promise.all([
    db.from('profiles').select('role').eq('id', handoff.actorId).maybeSingle(),
    db.from('courses').select('id').eq('id', handoff.targetId).maybeSingle(),
  ]);
  if (!course || !ADMIN_ROLES.has(String(actor?.role || ''))) return NextResponse.json({ error: 'Preview denied' }, { status: 403 });
  const response = NextResponse.redirect(new URL(`/lms/courses/${course.id}`, request.url));
  response.cookies.set(COURSE_PREVIEW_COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 30 * 60, path: '/' });
  return response;
}
