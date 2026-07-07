'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function submitEmployerApplication(formData: FormData) {
  const supabase = await createClient();

  const data = {
    company_name: formData.get('company_name') as string,
    contact_name: formData.get('contact_name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    address: formData.get('address') as string,
    industry: formData.get('industry') as string,
    hiring_needs: formData.get('hiring_needs') as string,
  };

  const { error } = await supabase.from('employer_applications').insert({
    ...data,
    status: 'pending',
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/apply/success');
}
