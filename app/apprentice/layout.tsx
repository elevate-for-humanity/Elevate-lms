import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Apprentice Portal',
  description: 'Apprentice dashboard, hours, documents, and training.',
};
export const dynamic = 'force-dynamic';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice');
  }

  // Role check — only students and admins can access the apprentice portal
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const ALLOWED = ['student', 'admin', 'super_admin', 'staff', 'instructor'];
  if (!profile?.role || !ALLOWED.includes(profile.role)) {
    redirect('/unauthorized');
  }

  const db = await getAdminClient();
  if (db) {
    const { data: barberSub } = await db
      .from('barber_subscriptions')
      .select('payment_status, suspension_deadline')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const isSuspended =
      barberSub?.payment_status === 'suspended' ||
      (barberSub?.payment_status === 'past_due' &&
        !!barberSub.suspension_deadline &&
        new Date(barberSub.suspension_deadline) < new Date());

    if (isSuspended) {
      redirect('/billing-required?reason=payment_failed');
    }
  }

  return children;
}
