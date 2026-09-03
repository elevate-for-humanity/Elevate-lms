import { PlatformShell } from '@/components/platform/PlatformShell';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const dynamic = 'force-dynamic';

/**
 * Program Holder dashboard boundary. Marketing middleware blocks anonymous
 * access; requireProgramHolder enforces the holder/tenant relationship before
 * the role-specific navigation shell renders.
 */
export default async function ProgramHolderDashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireProgramHolder();
  return <PlatformShell user={{ id: profile.id, email: user.email || '', full_name: profile.full_name || undefined }} role="program_holder">{children}</PlatformShell>;
}
