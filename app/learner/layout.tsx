import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { generateBreadcrumbs } from '@/lib/navigation/navigation-config';
import { IdleTimeoutGuard } from '@/components/auth/IdleTimeoutGuard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Learner Portal',
  description: 'Access your courses, track progress, and manage your career training journey.',
  robots: { index: false, follow: false },
};

export default async function LearnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/learner/dashboard');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name, first_name, last_name, avatar_url, email')
    .eq('id', user.id)
    .maybeSingle();

  // Get pathname for breadcrumbs
  const { headers: headersList } = await import('next/headers');
  const headers = await headersList();
  const pathname = headers.get('x-pathname') || '/learner';
  const breadcrumbs = generateBreadcrumbs(pathname);

  return (
    <PlatformShell
      user={{
        id: user.id,
        email: user.email || profile?.email || '',
        full_name: profile?.full_name || undefined,
        first_name: profile?.first_name || undefined,
        last_name: profile?.last_name || undefined,
        avatar_url: profile?.avatar_url || undefined,
      }}
      role="student"
      breadcrumbs={breadcrumbs}
    >
      <IdleTimeoutGuard />
      {children}
    </PlatformShell>
  );
}
