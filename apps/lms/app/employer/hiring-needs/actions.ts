'use server';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getEmployerRecord } from '@/lib/employer/employer-context';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
export async function saveHiringNeeds(form: FormData) {
  const { user } = await requireRole(['employer', 'sponsor']);
  const session = await createClient();
  const employer = await getEmployerRecord(session, user.id);
  if (!employer) throw new Error('Employer account is not linked. Contact Elevate.');
  const field = (key: string) =>
    String(form.get(key) || '')
      .trim()
      .slice(0, 4000);
  const roles = field('roles');
  const locations = field('locations');
  if (!roles || !locations)
    throw new Error('Describe your positions or training needs and locations.');
  const db = await requireAdminClient();
  const { data: current, error } = await db
    .from('employer_onboarding')
    .select('id,hiring_needs')
    .eq('employer_id', employer.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error('Hiring needs could not be loaded. Please retry.');
  const hiring_needs = {
    ...(current?.hiring_needs &&
    typeof current.hiring_needs === 'object' &&
    !Array.isArray(current.hiring_needs)
      ? current.hiring_needs
      : {}),
    roles,
    locations,
    timeline: field('timeline'),
    additionalInfo: field('additionalInfo'),
  };
  const result = current
    ? await db
        .from('employer_onboarding')
        .update({ hiring_needs, updated_at: new Date().toISOString() })
        .eq('id', current.id)
        .eq('employer_id', employer.id)
        .select('id')
        .maybeSingle()
    : await db
        .from('employer_onboarding')
        .insert({ employer_id: employer.id, status: 'onboarding_in_progress', hiring_needs })
        .select('id')
        .single();
  if (result.error || !result.data)
    throw new Error('Hiring needs could not be saved. Please retry.');
  revalidatePath('/employer/hiring-needs');
  revalidatePath('/employer/setup');
  redirect('/employer/hiring-needs?saved=1');
}
