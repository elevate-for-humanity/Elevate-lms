'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { getEmployerRecord } from '@/lib/employer/employer-context';

function value(formData: FormData, key: string): string {
  const raw = formData.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

export async function submitEmployerJob(formData: FormData) {
  const { user } = await requireRole(['employer', 'sponsor']);
  const supabase = await createClient();
  const employer = await getEmployerRecord(supabase, user.id);

  if (!employer) throw new Error('Complete employer onboarding before posting a job.');
  if (!employer.approved) throw new Error('Employer approval is required before posting a job.');

  const title = value(formData, 'title');
  const description = value(formData, 'description');
  const requirements = value(formData, 'requirements');
  const location = value(formData, 'location');
  const employmentType = value(formData, 'employment_type');
  const salaryRange = value(formData, 'salary_range');
  const benefits = value(formData, 'benefits');
  const requiredPrograms = formData
    .getAll('required_programs')
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());

  if (title.length < 3 || title.length > 160) throw new Error('Job title must be between 3 and 160 characters.');
  if (description.length < 20) throw new Error('Job description must be at least 20 characters.');
  if (!location) throw new Error('Job location is required.');
  if (!employmentType) throw new Error('Employment type is required.');

  const { data, error } = await supabase
    .from('job_postings')
    .insert({
      employer_id: employer.id,
      posted_by: user.id,
      title,
      description,
      requirements: requirements || null,
      location,
      employment_type: employmentType,
      job_type: employmentType,
      salary_range: salaryRange || null,
      benefits: benefits || null,
      required_programs: requiredPrograms,
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Unable to submit job posting: ${error.message}`);

  revalidatePath('/employer/jobs');
  revalidatePath('/employer/dashboard');
  redirect(`/employer/postings/${data.id}`);
}
