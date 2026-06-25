import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { generateBreadcrumbs } from '@/lib/navigation/navigation-config';
import { getMyPartnerContext } from '@/lib/partner/access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: {
    default: `Host Site Portal | ${PLATFORM_DEFAULTS.orgName}`,
    template: '%s | Host Site Portal',
  },
  description: `Manage your host site partnership with ${PLATFORM_DEFAULTS.orgName}.`,
};

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/partner/dashboard');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, first_name, last_name, avatar_url, email')
    .eq('id', user.id)
    .maybeSingle();

  // Only require login - no role restrictions

  const ctx = await getMyPartnerContext();

  if (!ctx) {
    return <>{children}</>;
  }

  // Get pathname for breadcrumbs
  const { headers: headersList } = await import('next/headers');
  const headers = await headersList();
  const pathname = headers.get('x-pathname') || '/partner';
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
      role="partner"
      breadcrumbs={breadcrumbs}
    >
      {children}
    </PlatformShell>
  );
}
