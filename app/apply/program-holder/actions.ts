'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function submitProgramHolderApplication(formData: FormData) {
  const supabase = await createClient();

  const data = {
    business_name: formData.get('business_name') as string,
    owner_name: formData.get('owner_name') as string,
    email: formData.get('email') as string,
    phone: formData.get('phone') as string,
    address: formData.get('address') as string,
    license_number: formData.get('license_number') as string,
    license_type: formData.get('license_type') as string,
    years_in_business: formData.get('years_in_business') as string,
    description: formData.get('description') as string,
  };

  const { error } = await supabase.from('program_holder_applications').insert({
    ...data,
    status: 'pending',
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/apply/success');
}
