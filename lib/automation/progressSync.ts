import { createClient } from '@/lib/supabase/server';

// lib/automation/progressSync.ts
import { getPartnerClient, PartnerType } from '../partners';



export async function syncSingleEnrollment(enrollmentId: string) {
  const supabase = await createClient();

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
  const supabase = await createClient();

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
