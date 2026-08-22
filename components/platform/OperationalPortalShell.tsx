import { PlatformShell } from '@/components/platform/PlatformShell';
import { requirePortalAccess } from '@/lib/auth/portal-access';
import type { PortalKey } from '@/lib/routing/portal-map';
import type { UserRole } from '@/lib/navigation/navigation-config';

const SHELL_ROLE: Partial<Record<PortalKey, UserRole>> = {
  casemanager: 'case_manager',
  workforceboard: 'workforce_board',
  provider: 'provider',
};

/**
 * Shared server boundary for operational portals physically hosted by the
 * Marketing application. Authorization comes from the canonical portal map;
 * presentation comes from the same PlatformShell used across authenticated
 * Elevate software.
 */
export async function OperationalPortalShell({
  portalKey,
  children,
}: {
  portalKey: 'casemanager' | 'workforceboard' | 'provider';
  children: React.ReactNode;
}) {
  const access = await requirePortalAccess(portalKey);
  const profile = access.profile;
  const shellRole = SHELL_ROLE[portalKey] ?? 'student';

  return (
    <PlatformShell
      user={{
        id: access.user.id,
        email: access.user.email || '',
        full_name: profile.full_name || undefined,
        first_name: profile.first_name || undefined,
        last_name: profile.last_name || undefined,
        avatar_url: profile.avatar_url || undefined,
      }}
      role={shellRole}
    >
      {children}
    </PlatformShell>
  );
}
