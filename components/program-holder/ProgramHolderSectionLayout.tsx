import { PlatformShell } from '@/components/platform/PlatformShell';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export async function ProgramHolderSectionLayout({ children }: { children: React.ReactNode }) {
  const { user, profile } = await requireProgramHolder();
  return <PlatformShell user={{ id: profile.id, email: user.email || '', full_name: profile.full_name || undefined }} role="program_holder">{children}</PlatformShell>;
}
