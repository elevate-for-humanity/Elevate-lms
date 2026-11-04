'use server';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getEmployerRecord } from '@/lib/employer/employer-context';
import { redirect } from 'next/navigation';
export async function acknowledgeOrientation(form: FormData) {
  const { user } = await requireRole(['employer', 'sponsor']);
  if (form.get('reviewed') !== 'yes')
    throw new Error('Review the employer orientation before acknowledging it.');
  const session = await createClient();
  const employer = await getEmployerRecord(session, user.id);
  if (!employer) throw new Error('Employer account is not linked.');
  const db = await requireAdminClient();
  const { error } = await db
    .from('employer_onboarding_progress')
    .upsert(
      {
        user_id: user.id,
        employer_id: employer.id,
        orientation_viewed: true,
        orientation_viewed_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );
  if (error) throw new Error('Orientation acknowledgment could not be saved. Please retry.');
  redirect('/employer/setup?orientation=saved');
}
