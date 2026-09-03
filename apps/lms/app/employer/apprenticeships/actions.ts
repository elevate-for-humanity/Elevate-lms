'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { getEmployerRecord } from '@/lib/employer/employer-context';

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function createEmployerApprenticeship(formData: FormData) {
  const { user } = await requireRole(['employer', 'sponsor']);
  const supabase = await createClient();
  const employer = await getEmployerRecord(supabase, user.id);

  if (!employer) {
    throw new Error('Complete employer onboarding before creating an apprenticeship program.');
  }

  const title = text(formData, 'title');
  const description = text(formData, 'description');
  const requirements = text(formData, 'requirements');
  const benefits = text(formData, 'benefits');
  const durationRaw = text(formData, 'duration_months');
  const durationMonths = durationRaw ? Number.parseInt(durationRaw, 10) : null;

  if (title.length < 3 || title.length > 160) {
    throw new Error('Program title must be between 3 and 160 characters.');
  }
  if (durationMonths !== null && (!Number.isInteger(durationMonths) || durationMonths < 1 || durationMonths > 120)) {
    throw new Error('Duration must be between 1 and 120 months.');
  }

  const { data, error } = await supabase
    .from('apprenticeships')
    .insert({
      employer_id: employer.id,
      title,
      description: description || null,
      requirements: requirements || null,
      benefits: benefits || null,
      duration_months: durationMonths,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Unable to create apprenticeship draft: ${error.message}`);
  }

  revalidatePath('/employer/apprenticeships');
  redirect(`/employer/apprenticeships/${data.id}`);
}
