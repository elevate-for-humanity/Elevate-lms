import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getRoleDestination } from '@/lib/auth/role-destinations';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard',
  alternates: { canonical: 'https://www.elevateforhumanity.org/dashboard' },
};

/**
 * Role-based dashboard router.
 * Destinations are defined in lib/auth/role-destinations.ts — edit there, not here.
 */
export default async function DashboardRouterPage() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      const { redirect } = await import('next/navigation');
      redirect('/login?redirect=/dashboard');
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, onboarding_completed, enrollment_status')
      .eq('id', user.id)
      .single();

    const role = profile?.role ?? 'student';

    // Students who haven't completed onboarding go there first — always.
    // Admins and staff bypass onboarding.
    const bypassOnboarding = ['admin', 'super_admin', 'org_admin', 'staff', 'instructor',
      'mentor', 'case_manager', 'creator', 'vita_staff', 'supersonic_staff'].includes(role);

    if (!bypassOnboarding && !profile?.onboarding_completed) {
      const { redirect } = await import('next/navigation');
      redirect('/onboarding/learner');
    }

    const destination = getRoleDestination(role);
    const { redirect } = await import('next/navigation');
    redirect(destination);
  } catch (error) {
    // redirect() throws — rethrow it
    throw error;
  }
}
