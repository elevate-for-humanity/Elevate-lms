import { redirect } from 'next/navigation';
import { requirePortalAccess } from '@/lib/auth/portal-access';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export async function requireParentPortal() {
  const access = await requirePortalAccess('parent');
  const supabase = await createClient();
  return { ...access, supabase };
}

export async function getVerifiedParentLinks(parentId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('parent_student_links')
    .select('student_id, relationship, verified')
    .eq('parent_id', parentId)
    .eq('verified', true)
    .limit(100);
  if (error) throw new Error('PARENT_LINKS_LOAD_FAILED');
  return data ?? [];
}

/**
 * Parents may only open a student through a verified parent/student link.
 * Platform Admin may inspect any student in this portal for support/oversight,
 * without fabricating a parent relationship.
 */
export async function requireParentStudentAccess(studentId: string) {
  const access = await requireParentPortal();
  if (access.isPlatformAdmin) {
    const db = await requireAdminClient();
    return { ...access, studentId, relationship: 'admin-oversight', db };
  }

  const { data: link } = await access.supabase
    .from('parent_student_links')
    .select('student_id, relationship, verified')
    .eq('parent_id', access.user.id)
    .eq('student_id', studentId)
    .eq('verified', true)
    .maybeSingle();
  if (!link) redirect('/parent-portal/dashboard?error=student-access-denied');

  // The verified relationship is the authorization boundary. Use the server-only
  // client after that check so the detail view can read governed progress tables
  // without widening their RLS policies to every authenticated parent account.
  const db = await requireAdminClient();
  return { ...access, studentId, relationship: link.relationship || 'guardian', db };
}
