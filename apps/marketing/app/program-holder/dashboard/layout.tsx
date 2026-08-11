import { PlatformShell } from '@/components/platform/PlatformShell';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const dynamic = 'force-dynamic';

/**
 * Program Holder dashboard boundary. Marketing middleware blocks anonymous
 * access; requireProgramHolder enforces the holder/tenant relationship before
 * the role-specific navigation shell renders.
 */
export default async function ProgramHolderDashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProgramHolder();

  return (
    <PlatformShell
      user={{
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || undefined,
        first_name: profile.first_name || undefined,
        last_name: profile.last_name || undefined,
        avatar_url: profile.avatar_url || undefined,
      }}
      role="program_holder"
    >
      {children}
    </PlatformShell>
  );
}
