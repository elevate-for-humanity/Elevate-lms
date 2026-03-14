
// lib/automation/progressSync.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getPartnerClient, PartnerType } from '../partners';

function getSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function syncSingleEnrollment(enrollmentId: string) {
  const supabase = getSupabaseServerClient();

  const { data: enrollment, error } = await supabase
    .from('partner_lms_enrollments')
    .select(
      `
      *,
      partner_lms_providers ( provider_type )
    `
    )
    .eq('id', enrollmentId)
    .maybeSingle();

  if (error || !enrollment) return;

  const partnerType = enrollment.partner_lms_providers
    .provider_type as PartnerType;
  const client = getPartnerClient(partnerType);

  const progress = await client.getProgress(enrollment.external_enrollment_id);

  if (!progress) return;

  await supabase
    .from('partner_lms_enrollments')
    .update({
      status: progress.completed ? 'completed' : 'active',
      progress_percentage: progress.percentage,
      completed_at: progress.completed
        ? progress.completedAt?.toISOString()
        : null,
      metadata: {
        ...(enrollment.metadata ?? {}),
        last_synced_at: new Date().toISOString(),
      },
    })
    .eq('id', enrollmentId);
}

export async function syncAllActivePartnerEnrollments() {
  const supabase = getSupabaseServerClient();

  const { data: enrollments } = await supabase
    .from('partner_lms_enrollments')
    .select('id')
    .in('status', ['pending', 'active']);

  if (!enrollments || !enrollments.length) return;

  for (const row of enrollments) {
    await syncSingleEnrollment(row.id);
    // Short delay to avoid hammering partner APIs
    await new Promise((res) => setTimeout(res, 100));
  }
}
