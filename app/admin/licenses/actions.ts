'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createLicense(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) throw new Error('Database unavailable');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('licenses').insert({
    tenant_id: formData.get('tenant_id') as string || null,
    tier: formData.get('tier') as string || 'standard',
    status: 'active',
    expires_at: formData.get('expires_at') as string || null,
  });

  if (error) throw new Error('Failed to process license action.');

  revalidatePath('/admin/licenses');
  redirect('/admin/licenses');
}
