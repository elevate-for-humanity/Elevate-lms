import { hasRecruitingAssignment } from '@/lib/program-holder/recruiting-access';
import type { Metadata } from 'next';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { ProgramHolderPhoneReceiver } from '@/components/program-holder/ProgramHolderPhoneReceiver';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const metadata: Metadata = {
  title: { default: 'Program Holder Portal', template: '%s | Elevate Program Holder' },
  description:
    'Manage approved programs, students, documents, training hours, and compliance actions.',
  manifest: '/manifest-program-holder.json',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: 'Elevate Program Holder',
    statusBarStyle: 'black-translucent',
  },
};

export const dynamic = 'force-dynamic';

export default async function ProgramHolderPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireProgramHolder({ allowPendingApproval: true });
  const assignment = context.holderId
    ? await context.db
        .from('program_holders')
        .select('features')
        .eq('id', context.holderId)
        .maybeSingle()
    : { data: null };
  return (
    <PlatformShell
      recruitingEnabled={hasRecruitingAssignment(assignment.data?.features)}
      user={{
        id: context.profile.id,
        email: context.user.email || '',
        full_name: context.profile.full_name || undefined,
        avatar_url: context.profile.avatar_url || undefined,
      }}
      role={context.profile.role === 'site_coordinator' ? 'site_coordinator' : 'program_holder'}
      paris={{ personName: context.profile.full_name || undefined, autoOpenOnDashboard: false }}
    >
      <ProgramHolderPhoneReceiver />
      <div className="program-holder-portal min-w-0 overflow-x-clip">{children}</div>
    </PlatformShell>
  );
}
