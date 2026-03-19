import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
    if (!user) redirect('/login?redirect=/dashboard');

    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    redirect(getRoleDestination(profile?.role));
  } catch {
    redirect('/login?redirect=/dashboard');
  }
}
