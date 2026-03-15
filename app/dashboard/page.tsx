import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dashboard',
  alternates: { canonical: 'https://www.elevateforhumanity.org/dashboard' },
};

/**
 * Role-based dashboard router.
 *
 * Every known role maps to an explicit destination.
 * Unknown roles get a hard redirect to /unauthorized — never silently
 * fall through to the learner dashboard.
 */
const ROLE_ROUTES: Record<string, string> = {
  // Admin tier
  super_admin: '/admin/dashboard',
  admin: '/admin/dashboard',
  org_admin: '/admin/dashboard',

  // Staff / operations
  staff: '/staff-portal/dashboard',
  instructor: '/instructor/dashboard',

  // Program holders / delegates
  program_holder: '/program-holder/dashboard',
  delegate: '/program-holder/dashboard',

  // Partners / sponsors
  partner: '/partner-portal',
  sponsor: '/partner-portal',

  // Workforce oversight
  workforce_board: '/workforce-board/dashboard',

  // Employer
  employer: '/employer/dashboard',

  // Mentor
  mentor: '/mentor/dashboard',

  // Creator
  creator: '/creator/dashboard',

  // Student (explicit, not a fallthrough)
  student: '/learner/dashboard',
};

export default async function DashboardRouterPage() {
  try {
    const supabase = await createClient();
    const _admin = createAdminClient();
    const db = _admin || supabase;

    if (!supabase) {
      return (
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
            <p className="text-gray-600">Please try again later.</p>
          </div>
        </div>
      );
    }

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect('/login?redirect=/dashboard');
    }

    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role;
    const target = role ? ROLE_ROUTES[role] : null;

    if (!target) {
      // Hard fail — never silently misroute
      redirect('/unauthorized?reason=unknown_role');
    }

    redirect(target);
  } catch {
    redirect('/login?redirect=/dashboard');
  }
}
