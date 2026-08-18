import { PlatformShell } from '@/components/platform/PlatformShell';
import { requireRole } from '@/lib/auth/require-role';

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
      }}
      role="student"
    >
      {children}
    </PlatformShell>
  );
}
