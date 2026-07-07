'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function submitStudentApplication(formData: FormData) {
  const supabase = await createClient();

  const data = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    address: formData.get('address') as string,
    city: formData.get('city') as string,
    state: formData.get('state') as string,
    zip_code: formData.get('zip_code') as string,
    program_interest: formData.get('program_interest') as string,
    experience_level: formData.get('experience_level') as string,
    goals: formData.get('goals') as string,
  };

  const { error } = await supabase.from('applications').insert({
    ...data,
    application_type: 'student',
    status: 'pending',
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/apply/success');
}
