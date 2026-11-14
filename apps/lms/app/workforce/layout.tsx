import { PlatformShell } from '@/components/platform/PlatformShell';
import { requireRole } from '@/lib/auth/require-role';
import { WORKFORCE_ACCESS_ROLES } from '@/lib/workforce/records';

export const dynamic = 'force-dynamic';

export default async function WorkforcePortalLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireRole(WORKFORCE_ACCESS_ROLES);

  return (
    <PlatformShell
      user={{
        id: user.id,
        email: user.email || '',
        full_name: profile.full_name || undefined,
        first_name: profile.first_name || undefined,
        last_name: profile.last_name || undefined,
      }}
      role="workforce"
    >
      {children}
    </PlatformShell>
  );
}
