import 'server-only';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { verifyPortalPreviewHandoff } from './portal-preview-handoff';
import { resolvePortalPreviewSubject } from './portal-preview';

export const COURSE_PREVIEW_COOKIE = 'elevate_course_preview';
const ADMIN_ROLES = new Set(['admin', 'super_admin', 'staff']);

export async function resolveCoursePreview(courseId?: string) {
  const token = (await cookies()).get(COURSE_PREVIEW_COOKIE)?.value || '';
  const handoff = token ? verifyPortalPreviewHandoff(token) : null;
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  // A retained administrator cookie must never turn a later learner sign-in
  // into read-only review or expose saved assessment answers. A signed handoff
  // still supports cross-service review when no local auth session exists.
  if (authError && authError.name !== 'AuthSessionMissingError') {
    return { active: false as const, db: null };
  }
  if (handoff && user && handoff.actorId !== user.id) {
    return { active: false as const, db: null };
  }
  if (!handoff || (courseId && handoff.targetId !== courseId)) {
    if (!courseId) return { active: false as const, db: null };
    const db = await requireAdminClient();
    const subject = await resolvePortalPreviewSubject(db, user?.id);
    if (!subject.previewing) return { active: false as const, db: null };
    const { data: enrollment, error } = await db
      .from('course_enrollments')
      .select('id')
      .eq('student_id', subject.userId)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .is('revoked_at', null)
      .maybeSingle();
    if (error || !enrollment) return { active: false as const, db: null };
    return { active: true as const, db, courseId };
  }
  const db = await requireAdminClient();
  const { data: actor } = await db
    .from('profiles')
    .select('role,is_active,suspended')
    .eq('id', handoff.actorId)
    .maybeSingle();
  if (
    actor?.is_active === false ||
    actor?.suspended === true ||
    !ADMIN_ROLES.has(String(actor?.role || ''))
  )
    return { active: false as const, db: null };
  return { active: true as const, db, courseId: handoff.targetId };
}
