
import { Metadata } from 'next';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Shop Reports New',
  description: 'Internal page for Shop Reports New',
  path: '/shop/reports/new',
});

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShopReportForm } from '@/components/shop/ShopReportForm';

export const dynamic = 'force-dynamic';


export default async function NewWeeklyReport() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/shop/reports/new');
  }

  // Get shop for this user
  const { data: staff } = await supabase
    .from('shop_staff')
    .select('shop_id')
    .eq('user_id', user.id);

  const shopId = staff?.[0]?.shop_id;

  if (!shopId) {
    redirect('/shop/dashboard');
  }

  // Get active placements for this shop
  const { data: placements } = await supabase
    .from('apprentice_placements')
    .select('id, profiles(id, full_name)')
    .eq('shop_id', shopId)
    .eq('status', 'active');

  return <ShopReportForm placements={placements || []} />;
}
