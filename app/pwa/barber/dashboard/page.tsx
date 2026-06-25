import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// /pwa/barber/dashboard is the login redirect target.
// The actual dashboard lives at /pwa/barber — redirect there.
export default async function BarberDashboardRedirect() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?redirect=/pwa/barber/dashboard');
  }

  redirect('/pwa/barber');
}
