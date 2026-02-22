import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';


export const metadata: Metadata = {
  title: 'Dashboard',
  alternates: { canonical: 'https://www.elevateforhumanity.org/dashboard' },
};

export default async function DashboardPage() {
  try {
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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

    // Get user profile to determine role
    const { data: profile } = await db
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Redirect based on role
    const role = profile?.role || 'student';
    
    switch (role) {
      case 'admin':
        redirect('/admin/dashboard');
        break; // redirect throws, but ESLint requires break
      case 'staff':
        redirect('/staff-portal/dashboard');
        break;
      case 'instructor':
        redirect('/instructor/dashboard');
        break;
      case 'program_holder':
        redirect('/program-holder/dashboard');
        break;
      case 'employer':
        redirect('/employer/dashboard');
        break;
      default:
        redirect('/learner/dashboard');
    }
  } catch {
    redirect('/login?redirect=/dashboard');
  }
}
