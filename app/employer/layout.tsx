import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { generateBreadcrumbs } from '@/lib/navigation/navigation-config';

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Employer Portal',
  description: 'Employer dashboard, hiring, and apprenticeship management.',
};

// Routes accessible during onboarding (before full activation)
const ONBOARDING_ALLOWED = [
  '/employer/verification',
  '/employer/documents',
  '/employer/documents/upload',
  '/employer/settings',
];

export default async function EmployerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public marketing page — no auth required
  if (!user) {
    return <>{children}</>;
  }

  const _admin = await requireAdminClient();
  const db = _admin;
  if (!db) throw new Error('Admin client failed to initialize');

  const { data: profile } = await db
    .from('profiles')
    .select('role, verified, full_name, first_name, last_name, avatar_url, email')
    .eq('id', user.id)
    .maybeSingle();

  // Non-employer logged-in users can still see the public page
  if (!profile || !['employer', 'sponsor', 'admin', 'super_admin'].includes(profile.role)) {
    return <>{children}</>;
  }

  // Check onboarding status
  const { data: onboarding } = await db
    .from('employer_onboarding')
    .select('status')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const isActive = onboarding?.status === 'active';
  const isApprovedOnboarding = onboarding?.status === 'approved';

  // If employer is not fully active, show content without PlatformShell
  if (!isActive && !isApprovedOnboarding) {
    if (!onboarding) return <>{children}</>;
    redirect('/onboarding/employer');
  }

  // Get pathname for breadcrumbs
  const { headers: headersList } = await import('next/headers');
  const headers = await headersList();
  const pathname = headers.get('x-pathname') || '/employer';
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
      role="employer"
      breadcrumbs={breadcrumbs}
    >
      {children}
    </PlatformShell>
  );
}
