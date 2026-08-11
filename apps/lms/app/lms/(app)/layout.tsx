import { PlatformShell } from '@/components/platform/PlatformShell';
import { requireRole } from '@/lib/auth/require-role';

export const dynamic = 'force-dynamic';

/**
 * Authenticated learner workspace boundary. The LMS middleware blocks anonymous
 * access before render; this layout adds role authorization and the canonical
 * learner navigation shell for every route in the (app) group.
 */
export default async function LearnerWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireRole(['student', 'learner', 'admin', 'staff']);

  return (
    <PlatformShell
      user={{
        id: user.id,
        email: user.email || '',
        full_name: profile?.full_name || undefined,
        first_name: profile?.first_name || undefined,
        last_name: profile?.last_name || undefined,
        avatar_url: profile?.avatar_url || undefined,
      }}
      role="student"
    >
      {children}
    </PlatformShell>
  );
}
