import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { IdleTimeoutGuard } from '@/components/auth/IdleTimeoutGuard';
import WorkforceShell from './WorkforceShell';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: `Workforce Portal | ${PLATFORM_DEFAULTS.orgName}`,
    template: '%s | Workforce Portal',
  },
  description: 'Participant management, placements, compliance, and workforce outcomes.',
  robots: { index: false, follow: false },
};

const ALLOWED_ROLES = ['workforce_board', 'case_manager', 'admin', 'super_admin', 'staff', 'org_admin'];

export default async function WorkforceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/workforce/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.role || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/unauthorized');
  }

  return (
    <>
      <IdleTimeoutGuard />
      <WorkforceShell
        role={profile.role}
        userName={profile.full_name ?? user.email ?? ''}
        userEmail={profile.email ?? user.email ?? ''}
      >
        {children}
      </WorkforceShell>
    </>
  );
}
