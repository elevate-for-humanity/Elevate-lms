import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import WorkforceBoardShell from './WorkforceBoardShell';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: `Workforce Board | ${PLATFORM_DEFAULTS.orgName}`,
    template: '%s | Workforce Board',
  },
  description: 'Workforce board dashboard and reporting.',
  robots: { index: false, follow: false },
};

const ALLOWED_ROLES = ['workforce_board', 'admin', 'super_admin', 'staff'];

export default async function WorkforceBoardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/workforce-board');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, email')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/unauthorized');
  }

  return (
    <WorkforceBoardShell userName={profile.full_name} userEmail={profile.email ?? user.email}>
      {children}
    </WorkforceBoardShell>
  );
}
