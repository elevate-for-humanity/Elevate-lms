
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Shop Onboarding Documents',
  description: 'Internal page for Shop Onboarding Documents',
  path: '/shop/onboarding/documents',
});

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { ShopDocumentUpload } from '@/components/shop/ShopDocumentUpload';


export default async function ShopDocumentsPage() {
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
    redirect('/login?next=/shop/onboarding/documents');
  }

  // Get shop for this user
  const { data: staff } = await db
    .from('shop_staff')
    .select('shop_id, shops(*)')
    .eq('user_id', user.id);

  const shop = staff?.[0]?.shops;

  if (!shop) {
    redirect('/shop/dashboard');
  }

  // Get required documents
  const { data: requirements } = await db
    .from('shop_document_requirements')
    .select('*')
    .eq('state', 'IN')
    .eq('program_slug', 'barber-apprenticeship')
    .order('required', { ascending: false })
    .order('display_name');

  return (
    <ShopDocumentUpload shopId={shop.id} requirements={requirements || []} />
  );
}
