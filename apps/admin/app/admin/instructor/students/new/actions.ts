'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function enrollStudentAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = (formData.get('email') as string)?.trim();
  const full_name = (formData.get('full_name') as string)?.trim();
  const program_id = (formData.get('program_id') as string)?.trim() || null;
  const phone = (formData.get('phone') as string)?.trim() || null;
  const notes = (formData.get('notes') as string)?.trim() || null;

  if (!email || !full_name) return;

  // Create a lead record so the student appears in CRM
  await supabase.from('leads').insert({
    first_name: full_name.split(' ')[0] ?? full_name,
    last_name: full_name.split(' ').slice(1).join(' ') || '',
    email,
    phone,
    program_interest: program_id,
    source: 'instructor',
    notes,
    status: 'new',
  });

  redirect('/admin/instructor/students');
}
