'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function submitStaffApplication(formData: FormData) {
  const supabase = await createClient();

  const data = {
    first_name: formData.get('first_name') as string,
    last_name: formData.get('last_name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    position: formData.get('position') as string,
    experience: formData.get('experience') as string,
    resume_link: formData.get('resume_link') as string,
  };

  const { error } = await supabase.from('staff_applications').insert({
    ...data,
    status: 'pending',
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/apply/success');
}
