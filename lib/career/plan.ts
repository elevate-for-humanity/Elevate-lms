import type { SupabaseClient } from '@supabase/supabase-js';
import { JOB_READY_MODULES } from './job-ready';

export async function loadCareerPlan(db: SupabaseClient, userId: string) {
  const [issued, earned, uploads, verified, resumes, jri] = await Promise.all([
    db
      .from('certificates')
      .select('id')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .or('status.is.null,status.in.(issued,active,valid)')
      .limit(1),
    db
      .from('learner_credentials')
      .select('id')
      .eq('learner_id', userId)
      .eq('status', 'active')
      .limit(1),
    db
      .from('student_credential_uploads')
      .select('id')
      .eq('user_id', userId)
      .in('verification_status', ['approved', 'verified'])
      .limit(1),
    db
      .from('credential_verification')
      .select('id')
      .eq('student_id', userId)
      .in('verification_status', ['approved', 'verified'])
      .limit(1),
    db
      .from('resumes')
      .select('id,resume_data')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1),
    db
      .from('scorm_enrollments')
      .select('scorm_package_id,status,progress_percentage')
      .eq('user_id', userId)
      .in(
        'scorm_package_id',
        JOB_READY_MODULES.map((module) => module.id),
      ),
  ]);
  return {
    credentialEarned: [issued, earned, uploads, verified].some(
      (result) => !result.error && Boolean(result.data?.length),
    ),
    credentialUnavailable: [issued, earned, uploads, verified].some((result) =>
      Boolean(result.error),
    ),
    resumeSaved: !resumes.error && Boolean(resumes.data?.[0]?.resume_data),
    resumeUnavailable: Boolean(resumes.error),
    jriUnavailable: Boolean(jri.error),
    jri: jri.data ?? [],
  };
}
export type CareerPlan = Awaited<ReturnType<typeof loadCareerPlan>>;
