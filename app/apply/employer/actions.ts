'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function submitEmployerApplication(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const companyName = formData.get('companyName') as string;
  const industry = formData.get('industry') as string;
  const companySize = formData.get('companySize') as string;
  const website = formData.get('website') as string;
  const phone = formData.get('phone') as string;
  const hiringNeeds = formData.get('hiringNeeds') as string;
  const positionsAvailable = formData.get('positionsAvailable') as string;

  // Create the employer application record
  const { data: application, error: applicationError } = await supabase
    .from('employer_applications')
    .insert({
      company_name: companyName,
      contact_name: `${firstName} ${lastName}`,
      email,
      phone,
      address: '',
      industry,
      company_size: companySize,
      website,
      hiring_needs: hiringNeeds,
      positions_available: positionsAvailable,
      status: 'pending',
    })
    .select('id')
    .single();

  if (applicationError) {
    console.error('Employer application error:', applicationError);
    // Continue anyway - the application was not fully saved but we can still create the user
  }

  // Create the user account
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
        role: 'employer',
        application_id: application?.id,
      },
    },
  });

  if (authError) {
    return { success: false, error: authError.message };
  }

  // If we have an application ID, link it to the user
  if (application?.id && authData.user) {
    await supabase
      .from('employer_applications')
      .update({ user_id: authData.user.id })
      .eq('id', application.id);
  }

  redirect('/apply/employer/success');
}
