import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { ApprenticeSubNav } from '@/components/portal/ApprenticeSubNav';
import { resolveApprenticeNavConfig } from '@/lib/portal/apprentice-nav-config';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { generateBreadcrumbs } from '@/lib/navigation/navigation-config';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Apprentice Portal',
  description: 'Apprentice dashboard, hours, documents, and training.',
};
export const dynamic = 'force-dynamic';

// Only require login - no role restrictions

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const h = await headers();
    const pathname = h.get('x-pathname') ?? '/apprentice';
    redirect(`/login?redirect=${encodeURIComponent(pathname)}`);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const programSlug = await resolveApprenticeProgramSlug(supabase, user.id);
  const nav = resolveApprenticeNavConfig(programSlug);

  const h = await headers();
  const pathname = h.get('x-pathname') ?? '/apprentice';
  const breadcrumbs = generateBreadcrumbs(pathname).map(crumb => {
    if (crumb.label === 'Apprentice') {
      return { label: 'Apprentice Portal', href: crumb.href };
    }
    return crumb;
  });

  return (
    <PlatformShell
      user={{
        id: user.id,
        email: user.email || '',
        full_name: profile?.full_name || undefined,
        first_name: profile?.first_name || undefined,
        last_name: profile?.last_name || undefined,
        avatar_url: profile?.avatar_url || undefined,
      }}
      role="apprentice"
      breadcrumbs={breadcrumbs}
    >
      {nav && <ApprenticeSubNav programSlug={nav.programSlug} config={nav.config} />}
      <div className="mt-4">{children}</div>
    </PlatformShell>
  );
}
