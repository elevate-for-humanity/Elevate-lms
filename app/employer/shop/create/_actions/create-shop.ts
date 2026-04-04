'use server';
import { createAdminClient } from '@/lib/supabase/admin';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function createShop(formData: FormData) {
  const supabase = await createClient();
  const db = createAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');

  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify employer role
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'employer') {
    redirect('/unauthorized');
  }

  // Extract form data
  const name = formData.get('name') as string;
  const ein = formData.get('ein') as string;
  const address1 = formData.get('address1') as string;
  const address2 = formData.get('address2') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const zip = formData.get('zip') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;

  // Create shop
  const { data: shop, error: shopError } = await db
    .from('shops')
    .insert({
      name,
      ein,
      address1,
      address2,
      city,
      state,
      zip,
      phone,
      email,
      active: true,
    })
    .select()
    .single();

  if (shopError || !shop) {
    throw new Error('Failed to create shop');
  }

  // Create shop_staff entry (make user the owner)
  const { error: staffError } = await db
    .from('shop_staff')
    .insert({
      shop_id: shop.id,
      user_id: user.id,
      role: 'owner',
    });

  if (staffError) {
    // Shop was created but staff link failed - this is a problem
    throw new Error('Shop created but failed to assign ownership');
  }

  // Redirect to employer dashboard
  redirect('/employer/dashboard');
}
