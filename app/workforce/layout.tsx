import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { IdleTimeoutGuard } from '@/components/auth/IdleTimeoutGuard';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { generateBreadcrumbs } from '@/lib/navigation/navigation-config';
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

const ALLOWED_ROLES = ['workforce_board', 'case_manager', 'admin', 'staff', 'org_admin'];

export default async function WorkforceLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/workforce/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, first_name, last_name, avatar_url, email')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile?.role || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/unauthorized');
  }

  // Get pathname for breadcrumbs
  const { headers: headersList } = await import('next/headers');
  const headers = await headersList();
  const pathname = headers.get('x-pathname') || '/workforce';
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <PlatformShell
      user={{
        id: user.id,
        email: user.email || profile.email || '',
        full_name: profile.full_name || undefined,
        first_name: profile.first_name || undefined,
        last_name: profile.last_name || undefined,
        avatar_url: profile.avatar_url || undefined,
      }}
      role="workforce"
      breadcrumbs={breadcrumbs}
    >
      <IdleTimeoutGuard />
      {children}
    </PlatformShell>
  );
}
