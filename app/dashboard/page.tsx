import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  // Get user role and redirect based on role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;

  // Role-based dashboard routing
  switch (role) {
    case 'admin':
    case 'super_admin':
    case 'staff':
      redirect('/admin/dashboard');
      break;
    case 'program_holder':
      redirect('/program-holder/dashboard');
      break;
    case 'host_shop':
      redirect('/host-shop/dashboard');
      break;
    case 'employer':
      redirect('/employer/dashboard');
      break;
    case 'partner':
      redirect('/partner/dashboard');
      break;
    case 'instructor':
      redirect('/admin/instructor/dashboard');
      break;
    case 'student':
    case 'learner':
    default:
      redirect('/learner/dashboard');
      break;
  }
}
