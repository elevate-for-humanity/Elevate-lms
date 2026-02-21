'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createJob(formData: FormData) {
  const supabase = await createClient();
  if (!supabase) throw new Error('Database unavailable');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('jobs').insert({
    title: formData.get('title') as string,
    company: formData.get('company') as string,
    location: formData.get('location') as string,
    type: formData.get('type') as string,
    salary_min: formData.get('salary_min') ? parseFloat(formData.get('salary_min') as string) : null,
    salary_max: formData.get('salary_max') ? parseFloat(formData.get('salary_max') as string) : null,
    description: formData.get('description') as string,
    requirements: formData.get('requirements') as string,
    status: 'active',
    created_by: user.id,
  });

  if (error) throw new Error('Failed to process job action.');

  revalidatePath('/admin/jobs');
  redirect('/admin/jobs');
}
