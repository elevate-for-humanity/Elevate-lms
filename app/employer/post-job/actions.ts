'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function postJobAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim();
  if (!title || !description) return;

  const job_type = (formData.get('job_type') as string) || 'full-time';
  const remote_type = (formData.get('remote_type') as string) || 'onsite';
  const location = (formData.get('location') as string)?.trim() || null;
  const salary_range = (formData.get('salary_range') as string)?.trim() || null;
  const deadline = (formData.get('deadline') as string) || null;
  const requirements = (formData.get('requirements') as string)?.trim() || null;
  const application_url = (formData.get('application_url') as string)?.trim() || null;

  // Workforce program flags
  const is_ojt = formData.get('is_ojt') === 'true';
  const is_apprenticeship = formData.get('is_apprenticeship') === 'true';
  const wotc_eligible = formData.get('wotc_eligible') === 'true';
  const wioa_approved = formData.get('wioa_approved') === 'true';

  // Resolve employer record
  const { data: employer } = await supabase
    .from('employers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  const { error: insertError } = await supabase.from('job_postings').insert({
    title,
    description,
    job_type,
    remote_type,
    location,
    salary_range,
    requirements,
    application_url,
    application_deadline: deadline || null,
    employer_id: employer?.id ?? null,
    is_ojt,
    is_apprenticeship,
    wotc_eligible,
    wioa_approved,
    status: 'active',
    posted_by: user.id,
  });

  if (insertError) {
    throw new Error(insertError.message || 'Failed to post job. Please try again.');
  }

  redirect('/employer/jobs');
}
