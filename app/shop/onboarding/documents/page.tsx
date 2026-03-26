
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { generateInternalMetadata } from '@/lib/seo/metadata';

export const metadata: Metadata = generateInternalMetadata({
  title: 'Shop Onboarding Documents',
  description: 'Internal page for Shop Onboarding Documents',
  path: '/shop/onboarding/documents',
});

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ShopDocumentUpload } from '@/components/shop/ShopDocumentUpload';


export default async function ShopDocumentsPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/shop/onboarding/documents');

  const { data: staff } = await supabase
    .from('shop_staff')
    .select('shop_id, shops(*)')
    .eq('user_id', user.id);

  const shop = staff?.[0]?.shops;
  if (!shop) redirect('/shop/dashboard');

  return (
    <ShopDocumentUpload shopId={(shop as any).id} requirements={[]} />
  );
}
