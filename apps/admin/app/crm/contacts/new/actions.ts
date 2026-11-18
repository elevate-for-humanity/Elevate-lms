'use server';

import { requireRole } from '@/lib/auth/require-role';
import { redirect } from 'next/navigation';
import { requireAdminClient } from '@/lib/supabase/admin';

export async function createContactAction(formData: FormData) {
  const { user } = await requireRole(['admin', 'staff']);
  const supabase = await requireAdminClient();

  const first_name = (formData.get('first_name') as string)?.trim();
  const last_name = (formData.get('last_name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim() || null;
  const company = (formData.get('company') as string)?.trim() || null;
  const city = (formData.get('city') as string)?.trim() || null;
  const state = (formData.get('state') as string)?.trim() || null;
  const notes = (formData.get('notes') as string)?.trim() || null;

  if (!first_name || !last_name || !email) return;

  const { error } = await supabase.from('crm_contacts').insert({
    first_name,
    last_name,
    email,
    phone,
    company,
    address_city: city,
    address_state: state,
    notes,
    created_by: user.id,
  });

  if (error) throw new Error('The contact could not be saved.');
  redirect('/crm/contacts');
}
