import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// /pwa/shop-owner/dashboard is the login redirect target.
// The actual dashboard lives at /pwa/shop-owner — redirect there.
export default async function ShopOwnerDashboardRedirect() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login?redirect=/pwa/shop-owner/dashboard');
  }

  redirect('/pwa/shop-owner');
}
