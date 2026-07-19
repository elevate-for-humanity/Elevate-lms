'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function createLeadAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const first_name = (formData.get('first_name') as string)?.trim();
  const last_name = (formData.get('last_name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim() || null;
  const program_interest = (formData.get('program_interest') as string)?.trim() || null;
  const source = (formData.get('source') as string) || 'manual';
  const notes = (formData.get('notes') as string)?.trim() || null;

  if (!first_name || !last_name || !email) return;

  await supabase.from('leads').insert({
    first_name,
    last_name,
    email,
    phone,
    program_interest,
    source,
    notes,
    status: 'new',
  });

  redirect('/admin/crm/leads');
}
