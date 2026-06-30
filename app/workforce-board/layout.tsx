import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { generateBreadcrumbs } from '@/lib/navigation/navigation-config';
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
    .select('role, full_name, first_name, last_name, avatar_url, email')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    redirect('/unauthorized');
  }

  const { headers: headersList } = await import('next/headers');
  const headers = await headersList();
  const pathname = headers.get('x-pathname') || '/workforce-board';
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
      {children}
    </PlatformShell>
  );
}
