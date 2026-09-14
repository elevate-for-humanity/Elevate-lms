import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createPortalPreviewHandoff } from '@/lib/admin/portal-preview-handoff';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest) {
  const actor = await apiRequireAdmin(request);
  if (actor.error) return actor.error;
  const courseId = request.nextUrl.searchParams.get('courseId')?.trim() || '';
  if (!UUID.test(courseId)) return NextResponse.json({ error: 'Valid courseId required' }, { status: 400 });
  const db = await requireAdminClient();
  const { data: course } = await db.from('courses').select('id').eq('id', courseId).maybeSingle();
  if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org').replace(/\/$/, '');
  const handoff = createPortalPreviewHandoff(actor.id, courseId, 30 * 60 * 1000);
  return NextResponse.redirect(`${appUrl}/api/admin/course-preview?handoff=${encodeURIComponent(handoff)}`);
}
