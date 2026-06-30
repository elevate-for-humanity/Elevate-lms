import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { EmployerNav } from './EmployerNav';

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
  title: 'Employer Portal',
  description: 'Employer dashboard, hiring, and apprenticeship management.',
};

/**
 * Employer layout gate.
 *
 * Checks onboarding status before granting portal access.
 * Employers must complete all onboarding steps (MOU, insurance, verification)
 * before accessing dashboard, hours, placements, etc.
 *
 * Allowed without full onboarding: /employer (landing), /employer/verification,
 * /employer/documents/upload (needed during onboarding).
 */

// Routes accessible during onboarding (before full activation)
const ONBOARDING_ALLOWED = [
  '/employer/verification',
  '/employer/documents',
  '/employer/documents/upload',
  '/employer/settings',
];

// Sub-routes that require an authenticated employer account
const PORTAL_ROUTES = [
  '/employer/dashboard',
  '/employer/candidates',
  '/employer/jobs',
  '/employer/placements',
  '/employer/hours',
  '/employer/reports',
  '/employer/analytics',
  '/employer/apprenticeships',
  '/employer/opportunities',
  '/employer/settings',
  '/employer/compliance',
  '/employer/post-job',
  '/employer/verification',
  '/employer/documents',
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
    .select('role, verified')
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

  const shell = (content: React.ReactNode) => (
    <div className="min-h-screen bg-white">
      <EmployerNav />
      <main>{content}</main>
    </div>
  );

  // If employer is fully active, allow everything
  if (isActive) return shell(children);

  // If approved but still onboarding
  if (isApprovedOnboarding) return shell(children);

  // No onboarding row = application pending admin review
  if (!onboarding) return <>{children}</>;

  // Has an onboarding row but not active/approved → redirect to onboarding
  redirect('/onboarding/employer');
}
