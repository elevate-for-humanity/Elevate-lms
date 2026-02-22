
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Shop Reports New',
  description: 'Internal page for Shop Reports New',
  path: '/shop/reports/new',
});

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { ShopReportForm } from '@/components/shop/ShopReportForm';


export default async function NewWeeklyReport() {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/shop/reports/new');
  }

  // Get shop for this user
  const { data: staff } = await db
    .from('shop_staff')
    .select('shop_id')
    .eq('user_id', user.id);

  const shopId = staff?.[0]?.shop_id;

  if (!shopId) {
    redirect('/shop/dashboard');
  }

  // Get active placements for this shop
  const { data: placements } = await db
    .from('apprentice_placements')
    .select('id, profiles(id, full_name)')
    .eq('shop_id', shopId)
    .eq('status', 'active');

  return <ShopReportForm placements={placements || []} />;
}
