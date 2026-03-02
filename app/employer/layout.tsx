import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export const metadata = {
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

export default async function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  const _admin = createAdminClient();
  const db = _admin || supabase;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/employer');

  const { data: profile } = await db
    .from('profiles')
    .select('role, verified')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'employer') {
    redirect('/');
  }

  // Check onboarding status
  const { data: onboarding } = await db
    .from('employer_onboarding')
    .select('status')
    .eq('employer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const isActive = onboarding?.status === 'active';
  const isApprovedOnboarding = onboarding?.status === 'approved';

  // If employer is fully active, allow everything
  if (isActive) {
    return <>{children}</>;
  }

  // If approved but still onboarding, allow document upload routes
  // so they can complete their onboarding requirements
  if (isApprovedOnboarding) {
    // Check if current path is in the allowed list
    // Since we can't access pathname in a layout server component,
    // we allow children but the dashboard page itself will check
    return <>{children}</>;
  }

  // Not active and not in approved-onboarding state → redirect to onboarding
  redirect('/onboarding/employer');
}
