'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function createContactAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const first_name = (formData.get('first_name') as string)?.trim();
  const last_name = (formData.get('last_name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim() || null;
  const company = (formData.get('company') as string)?.trim() || null;
  const city = (formData.get('city') as string)?.trim() || null;
  const state = (formData.get('state') as string)?.trim() || null;
  const notes = (formData.get('notes') as string)?.trim() || null;

  if (!first_name || !last_name || !email) return;

  await supabase.from('crm_contacts').insert({
    first_name,
    last_name,
    email,
    phone,
    company,
    city,
    state,
    notes,
    created_by: user.id,
  });

  redirect('/admin/crm/contacts');
}
