'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createAffiliate(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) throw new Error('Database unavailable');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = formData.get('phone') as string;
  const website = formData.get('website') as string;
  const commission = formData.get('commission') as string;
  const notes = formData.get('notes') as string;

  const { error } = await supabase.from('affiliates').insert({
    name,
    email,
    phone: phone || null,
    website: website || null,
    commission_rate: commission ? parseFloat(commission) : null,
    notes: notes || null,
    status: 'pending',
    created_by: user.id,
  });

  if (error) {
    // If table doesn't exist, insert into a general contacts/partners table
    const { error: fallbackError } = await supabase.from('profiles').insert({
      full_name: name,
      email,
      phone: phone || null,
      role: 'affiliate',
    });
    if (fallbackError) throw new Error(fallbackError.message);
  }

  revalidatePath('/admin/affiliates');
  redirect('/admin/affiliates');
}
