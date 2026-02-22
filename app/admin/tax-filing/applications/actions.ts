'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createTaxApplication(formData: FormData) {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) throw new Error('Database unavailable');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await db.from('tax_applications').insert({
    client_name: formData.get('client_name') as string,
    client_email: formData.get('client_email') as string,
    client_phone: formData.get('client_phone') as string || null,
    filing_type: formData.get('filing_type') as string || 'individual',
    tax_year: formData.get('tax_year') as string || new Date().getFullYear().toString(),
    status: 'pending',
    notes: formData.get('notes') as string || null,
    created_by: user.id,
  });

  if (error) throw new Error('Failed to process tax filing application.');

  revalidatePath('/admin/tax-filing/applications');
  redirect('/admin/tax-filing/applications');
}
