import { resolveAssignedLearnerHome } from '@/lib/portal/assigned-learner-home';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EmailWorkspace } from '@/components/communications/EmailWorkspace';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { normalizeRole } from '@/lib/rbac/role-matrix';
import { ROLE_DISPLAY_NAMES, type UserRole } from '@/lib/navigation/navigation-config';
export const dynamic = 'force-dynamic';
export default async function InterofficeEmail({
  searchParams,
}: {
  searchParams: Promise<{ to?: string; subject?: string }>;
}) {
  const params = await searchParams;
  const initialRecipient =
    typeof params.to === 'string' && /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(params.to)
      ? params.to.slice(0, 254)
      : undefined;
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  const admin = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(admin, user?.id);
  if (!subject.userId) redirect('/login?redirect=%2Fcommunications%2Femail');
  const { data: profile, error } = await admin
    .from('profiles')
    .select('email,full_name,role,avatar_url')
    .eq('id', subject.userId)
    .maybeSingle();
  if (error || !profile) throw new Error('Email account profile could not be loaded.');
  const role =
    normalizeRole(profile.role) ||
    (Object.hasOwn(ROLE_DISPLAY_NAMES, profile.role) ? (profile.role as UserRole) : null);
  if (!role) throw new Error('Email account role could not be resolved.');
  const assignedHome = ['student', 'learner'].includes(role)
    ? await resolveAssignedLearnerHome(admin, subject.userId)
    : null;
  const shellRole = assignedHome?.startsWith('/apprentice') ? 'apprentice' : role;
  return (
    <PlatformShell
      user={{
        id: subject.userId,
        email: profile.email || '',
        full_name: profile.full_name || undefined,
        avatar_url: profile.avatar_url || undefined,
      }}
      role={shellRole}
    >
      <main className="p-4">
        <EmailWorkspace
          roleLabel="account holder"
          initialRecipient={initialRecipient}
          initialSubject={typeof params.subject === 'string' ? params.subject.slice(0, 200) : ''}
        />
      </main>
    </PlatformShell>
  );
}
