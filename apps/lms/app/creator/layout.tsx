import { PlatformShell } from '@/components/platform/PlatformShell';
import { requirePortalAccess } from '@/lib/auth/portal-access';

export const dynamic = 'force-dynamic';

export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const access = await requirePortalAccess('creator');
  return (
    <PlatformShell
      user={{
        id: access.user.id,
        email: access.user.email || '',
        full_name: access.profile.full_name || undefined,
        first_name: access.profile.first_name || undefined,
        last_name: access.profile.last_name || undefined,
      }}
      role="creator"
    >
      {children}
    </PlatformShell>
  );
}
