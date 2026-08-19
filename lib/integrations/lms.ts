/**
 * LMS Enrollment Adapter
 *
 * program_enrollments is the canonical enrollment authority. Legacy apprentice
 * rows are maintained only as compatibility records; registered completion
 * rules come from the registered-program contract and are never invented here.
 */

import { createClient } from '@/lib/supabase/server';
import { createOrUpdateEnrollment } from '@/lib/enrollment-service';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';
import { logger } from '@/lib/logger';

export interface LmsEnrollmentRequest {
  applicationId: string;
  applicantId: string;
  programId: string;
  programSlug?: string;
  email: string;
  firstName: string;
  lastName: string;
  applicationType: 'STUDENT' | 'APPRENTICE' | 'TESTING_CANDIDATE';
  fundingSource?: string;
  metadata?: Record<string, unknown>;
}

export interface LmsEnrollmentResult {
  enrollmentId: string;
  lmsUserId: string;
  dashboardId: string;
  apprenticeRecordId?: string;
}

export interface LmsUnenrollmentResult {
  success: boolean;
  message?: string;
}

export async function createLmsEnrollment(input: LmsEnrollmentRequest): Promise<LmsEnrollmentResult> {
  const supabase = await createClient();

  const { data: profile } = await supabase.from('profiles').select('id').eq('id', input.applicantId).single();
  if (!profile) throw new Error(`User account not found: ${input.applicantId}`);

  const enrollmentResult = await createOrUpdateEnrollment(supabase, {
    userId: input.applicantId,
    programId: input.programId,
    programSlug: input.programSlug,
    fundingSource: input.fundingSource,
    email: input.email,
    fullName: `${input.firstName} ${input.lastName}`,
    status: 'active',
    paymentStatus: 'pending',
    enrollmentState: 'confirmed',
    nextRequiredAction: 'ORIENTATION',
  });

  if (enrollmentResult.error || !enrollmentResult.id) {
    throw new Error(`Enrollment failed: ${enrollmentResult.error || 'Unknown error'}`);
  }

  logger.info('[lms-adapter] Enrollment created', {
    enrollmentId: enrollmentResult.id,
    userId: input.applicantId,
    programId: input.programId,
  });

  const dashboardId = await getOrCreateStudentDashboard(supabase, {
    userId: input.applicantId,
    enrollmentId: enrollmentResult.id,
    firstName: input.firstName,
    lastName: input.lastName,
  });

  let apprenticeRecordId: string | undefined;
  if (input.applicationType === 'APPRENTICE') {
    apprenticeRecordId = await getOrCreateApprenticeRecord(supabase, {
      userId: input.applicantId,
      enrollmentId: enrollmentResult.id,
      applicationId: input.applicationId,
      programId: input.programId,
      programSlug: input.programSlug,
      hostShopId: input.metadata?.hostShopId as string | undefined,
    });
  }

  return {
    enrollmentId: enrollmentResult.id,
    lmsUserId: profile.id,
    dashboardId,
    apprenticeRecordId,
  };
}

async function getOrCreateStudentDashboard(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: { userId: string; enrollmentId: string; firstName: string; lastName: string },
): Promise<string> {
  const { data: existing } = await supabase.from('student_dashboards').select('id').eq('user_id', data.userId).maybeSingle();
  if (existing?.id) return existing.id;

  const { data: dashboard, error } = await supabase
    .from('student_dashboards')
    .insert({
      user_id: data.userId,
      enrollment_id: data.enrollmentId,
      display_name: `${data.firstName} ${data.lastName}`,
      status: 'active',
    })
    .select('id')
    .single();

  if (error) {
    logger.warn('[lms-adapter] Dashboard creation failed', { error: error.message });
    return data.enrollmentId;
  }
  return dashboard?.id || data.enrollmentId;
}

async function getOrCreateApprenticeRecord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  data: {
    userId: string;
    enrollmentId: string;
    applicationId: string;
    programId: string;
    programSlug?: string;
    hostShopId?: string;
  },
): Promise<string> {
  const { data: existing } = await supabase
    .from('apprentices')
    .select('id')
    .eq('user_id', data.userId)
    .eq('enrollment_id', data.enrollmentId)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: occupation } = await supabase
    .from('apprenticeship_occupations')
    .select('ojl_hours_required, rti_hours_required, competencies_required')
    .eq('program_id', data.programId)
    .maybeSingle();

  const registered = data.programSlug ? getRegisteredProgramStandard(data.programSlug) : null;
  const ojlRequired = registered?.completion.fixedOjlCompletionHours ?? Number(occupation?.ojl_hours_required || 0);
  const rtiRequired = registered?.completion.requiredRtiHours ?? Number(occupation?.rti_hours_required || 0);
  const competenciesRequired = registered?.completion.competencyCount ?? Number(occupation?.competencies_required || 0);

  const { data: apprentice, error } = await supabase
    .from('apprentices')
    .insert({
      user_id: data.userId,
      enrollment_id: data.enrollmentId,
      application_id: data.applicationId,
      program_id: data.programId,
      host_shop_id: data.hostShopId || null,
      status: 'active',
      ojl_hours: 0,
      ojl_hours_required: ojlRequired,
      rti_hours: 0,
      rti_hours_required: rtiRequired,
      competencies_completed: 0,
      competencies_required: competenciesRequired,
    })
    .select('id')
    .single();

  if (error) {
    logger.warn('[lms-adapter] Apprentice compatibility record creation failed', { error: error.message });
    return '';
  }

  // Canonical competency records are created against program_enrollments when
  // an authorized verifier records evidence. Do not pre-seed legacy checklist
  // rows with a second identity model here.
  return apprentice?.id || '';
}

export async function checkExistingEnrollment(applicationId: string): Promise<LmsEnrollmentResult | null> {
  const supabase = await createClient();
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id, user_id')
    .eq('stripe_checkout_session_id', applicationId)
    .maybeSingle();
  if (!enrollment) return null;

  const [{ data: profile }, { data: dashboard }] = await Promise.all([
    supabase.from('profiles').select('id').eq('id', enrollment.user_id).single(),
    supabase.from('student_dashboards').select('id').eq('user_id', enrollment.user_id).maybeSingle(),
  ]);

  return {
    enrollmentId: enrollment.id,
    lmsUserId: profile?.id || enrollment.user_id,
    dashboardId: dashboard?.id || enrollment.id,
  };
}

export async function storeEnrollmentRecord(applicationId: string, result: LmsEnrollmentResult): Promise<void> {
  const supabase = await createClient();
  await supabase.from('program_enrollments').update({ stripe_checkout_session_id: applicationId }).eq('id', result.enrollmentId);
}

export async function getEnrollmentStatus(
  applicationId: string,
): Promise<{ enrolled: boolean; enrollmentId?: string; lmsUserId?: string; dashboardUrl?: string } | null> {
  const supabase = await createClient();
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id, user_id')
    .eq('stripe_checkout_session_id', applicationId)
    .maybeSingle();
  if (!enrollment) return null;

  const { data: dashboard } = await supabase.from('student_dashboards').select('id').eq('user_id', enrollment.user_id).maybeSingle();
  return {
    enrolled: true,
    enrollmentId: enrollment.id,
    lmsUserId: enrollment.user_id,
    dashboardUrl: dashboard?.id ? `/learner/dashboard?id=${dashboard.id}` : '/lms/dashboard',
  };
}

export async function unenrollFromLms(applicationId: string): Promise<LmsUnenrollmentResult> {
  const supabase = await createClient();
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('id')
    .eq('stripe_checkout_session_id', applicationId)
    .maybeSingle();
  if (!enrollment) return { success: false, message: 'Enrollment not found' };

  const { error } = await supabase
    .from('program_enrollments')
    .update({ status: 'cancelled', payment_status: 'refunded' })
    .eq('id', enrollment.id);
  if (error) {
    logger.error('[lms-adapter] Unenrollment failed', { error: error.message });
    return { success: false, message: error.message };
  }
  return { success: true, message: 'Unenrollment processed' };
}

export async function getStudentDashboardUrl(applicationId: string): Promise<string | null> {
  const status = await getEnrollmentStatus(applicationId);
  return status?.dashboardUrl ?? null;
}

export async function getStudentCredentials(
  applicationId: string,
): Promise<{ email: string; temporaryPassword: string; loginUrl: string } | null> {
  const supabase = await createClient();
  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('user_id')
    .eq('stripe_checkout_session_id', applicationId)
    .maybeSingle();
  if (!enrollment?.user_id) return null;

  const { data: profile } = await supabase.from('profiles').select('email').eq('id', enrollment.user_id).single();
  if (!profile?.email) return null;

  return {
    email: profile.email,
    temporaryPassword: '',
    loginUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
  };
}

export async function updateLmsEnrollment(
  enrollmentId: string,
  updates: { hostShopId?: string; mentorId?: string; startDate?: Date; expectedEndDate?: Date },
): Promise<void> {
  const supabase = await createClient();
  const updatePayload: Record<string, unknown> = {};
  if (updates.hostShopId) updatePayload.host_shop_id = updates.hostShopId;
  if (updates.startDate) updatePayload.start_date = updates.startDate.toISOString();
  if (updates.expectedEndDate) updatePayload.expected_end_date = updates.expectedEndDate.toISOString();
  if (Object.keys(updatePayload).length > 0) {
    await supabase.from('program_enrollments').update(updatePayload).eq('id', enrollmentId);
  }
}

export async function getApprenticeshipRecords(
  apprenticeRecordId: string,
): Promise<{
  ojlHours: number;
  rtiProgress: number;
  competenciesCompleted: number;
  totalCompetencies: number;
  evaluations: Array<{ id: string; date: string; score: number; notes: string }>;
} | null> {
  const supabase = await createClient();
  const { data: apprentice } = await supabase
    .from('apprentices')
    .select('ojl_hours, rti_hours, ojl_hours_required, rti_hours_required, competencies_completed, competencies_required')
    .eq('id', apprenticeRecordId)
    .single();
  if (!apprentice) return null;

  const { data: evaluations } = await supabase
    .from('apprentice_evaluations')
    .select('id, evaluation_date, score, notes')
    .eq('apprentice_id', apprenticeRecordId)
    .order('evaluation_date', { ascending: false });

  const rtiRequired = Number(apprentice.rti_hours_required || 0);
  const rtiHours = Number(apprentice.rti_hours || 0);
  return {
    ojlHours: Number(apprentice.ojl_hours || 0),
    rtiProgress: rtiRequired > 0 ? Math.min(100, Math.round((rtiHours / rtiRequired) * 100)) : 0,
    competenciesCompleted: Number(apprentice.competencies_completed || 0),
    totalCompetencies: Number(apprentice.competencies_required || 0),
    evaluations: evaluations?.map((e) => ({ id: e.id, date: e.evaluation_date || '', score: e.score || 0, notes: e.notes || '' })) || [],
  };
}

export async function verifyLmsConnection(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('program_enrollments').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}
