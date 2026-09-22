import 'server-only';
import { cookies } from 'next/headers';
import { requireAdminClient } from '@/lib/supabase/admin';
import { verifyPortalPreviewHandoff } from './portal-preview-handoff';

export const COURSE_PREVIEW_COOKIE = 'elevate_course_preview';
const ADMIN_ROLES = new Set(['admin', 'super_admin', 'staff']);

export async function resolveCoursePreview(courseId?: string) {
  const token = (await cookies()).get(COURSE_PREVIEW_COOKIE)?.value || '';
  const handoff = token ? verifyPortalPreviewHandoff(token) : null;
  if (!handoff || (courseId && handoff.targetId !== courseId)) {
    return { active: false as const, db: null };
  }
  const db = await requireAdminClient();
  const { data: actor } = await db.from('profiles').select('role').eq('id', handoff.actorId).maybeSingle();
  if (!ADMIN_ROLES.has(String(actor?.role || ''))) return { active: false as const, db: null };
  return { active: true as const, db, courseId: handoff.targetId };
}
