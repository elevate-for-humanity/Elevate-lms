import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// All routes under (onboarding) require an authenticated program_holder or partner.
// Public visitors are redirected to login, then back here after sign-in.
export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/partners/barbershop-apprenticeship/forms');
  }

  const db = createAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const allowed = ['program_holder', 'admin', 'super_admin', 'staff', 'employer', 'partner'];
  if (!profile || !allowed.includes(profile.role)) {
    // Authenticated but wrong role — send to the public partner page
    redirect('/partners/barbershop-apprenticeship');
  }

  return <>{children}</>;
}
