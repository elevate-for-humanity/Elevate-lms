import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export default async function CosmetologyOnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/partners/cosmetology-apprenticeship/handbook');
  }

  const db = await getAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const allowed = ['program_holder', 'admin', 'super_admin', 'staff', 'employer', 'partner'];
  if (!profile || !allowed.includes(profile.role)) {
    redirect('/partners/cosmetology-apprenticeship');
  }

  return <>{children}</>;
}
