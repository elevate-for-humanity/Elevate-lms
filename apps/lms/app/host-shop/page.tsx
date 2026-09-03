import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Host Shop Portal | Elevate for Humanity',
  robots: { index: false, follow: false },
};

/**
 * The public Host Shop sales/application experience lives on
 * https://www.elevateforhumanity.org/host-shop.
 * This LMS route is only a secure portal gateway; it must not duplicate public
 * marketing content or expose fabricated aggregate metrics.
 */
export default async function HostShopPortalGateway() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/host-shop/login');
  }

  redirect('/host-shop/dashboard');
}
