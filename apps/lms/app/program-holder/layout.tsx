import Link from 'next/link';
import { hasRecruitingAssignment } from '@/lib/program-holder/recruiting-access';
import type { Metadata } from 'next';
import { PlatformShell } from '@/components/platform/PlatformShell';
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
  const memberships = context.mode === 'holder'
    ? await context.db.from('partner_users').select('role,status,partner_id')
        .eq('user_id', context.user.id).eq('status','active')
    : { data: [], error: null };
  // An approved Host Shop may be opened as a second workspace without
  // replacing the holder's signed agreements or student scope.
  const eligibleHostShop = !memberships.error && (memberships.data || []).some(
    membership => ['owner','partner_admin','admin','supervisor','mentor','manager']
      .includes(String(membership.role || '').toLowerCase()),
  );
  return (
    <PlatformShell
      recruitingEnabled={hasRecruitingAssignment(assignment.data?.features)}
      alternateWorkspace={eligibleHostShop ? { label: 'Host Shop', href: '/host-shop/dashboard' } : undefined}
      user={{
        id: context.profile.id,
        email: context.user.email || '',
        full_name: context.profile.full_name || undefined,
        avatar_url: context.profile.avatar_url || undefined,
      }}
      role={context.profile.role === 'site_coordinator' ? 'site_coordinator' : 'program_holder'}
      paris={{ personName: context.profile.full_name || undefined, autoOpenOnDashboard: false }}
    >
      <div className="program-holder-portal min-w-0 overflow-x-clip"><nav aria-label="Partner onboarding" className="mx-auto max-w-6xl px-4 py-3"><Link href="/program-holder/orientation" className="inline-flex min-h-11 items-center rounded-xl border border-blue-200 bg-white px-4 font-bold text-blue-900">Start here: PARIS onboarding, forms and signatures</Link></nav>{children}</div>
    </PlatformShell>
  );
}
