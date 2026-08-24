import { createClient } from '@/lib/supabase/server';
import { getUserEnrollments, type NormalizedEnrollment } from '@/lib/enrollments/getUserEnrollments';
import { getRequiredAgreements, type RequiredAgreement } from '@/lib/legal/requiredAgreements';

export type LearnerRequirement = {
  id: string;
  requirement_type: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  status: string;
  evidence_url: string | null;
  completed_at: string | null;
};

export type LearnerOnboardingStep = {
  id: string;
  title: string;
  description: string;
  href: string;
  status: 'complete' | 'in_progress' | 'missing' | 'pending_review' | 'blocked' | 'not_applicable';
  completedAt: string | null;
  blocking: boolean;
};

export type LearnerWorkspace = {
  enrollments: NormalizedEnrollment[];
  requirements: LearnerRequirement[];
  agreements: Array<RequiredAgreement & { signed: boolean; acceptedAt: string | null }>;
  onboardingSteps: LearnerOnboardingStep[];
  binder: { id: string; status: string; enrollment_id: string | null } | null;
  nextRequiredAction: LearnerOnboardingStep | null;
  onboardingPercent: number;
  warnings: string[];
};

export async function loadLearnerWorkspace(userId: string, role = 'student'): Promise<LearnerWorkspace> {
  const supabase = await createClient();
  const warnings: string[] = [];
  const enrollmentResult = await getUserEnrollments(userId);
  if (enrollmentResult.error) warnings.push('Enrollment records could not be loaded.');

  const primaryEnrollment = enrollmentResult.enrollments.find((row) =>
    ['active', 'enrolled', 'in_progress', 'pending'].includes(row.status.toLowerCase()),
  ) ?? enrollmentResult.enrollments[0] ?? null;
  const trainingEnrollment = enrollmentResult.enrollments.find((row) =>
    row.source_table === 'partner_lms_enrollments' && ['active', 'enrolled', 'in_progress'].includes(row.status.toLowerCase()),
  ) ?? primaryEnrollment;

  const [profileResult, progressResult, requirementResult, agreementResult, binderResult] = await Promise.all([
    supabase.from('profiles').select('full_name,phone,onboarding_completed').eq('id', userId).maybeSingle(),
    supabase.from('onboarding_progress').select('is_complete,current_step,completed_at,profile_completed,profile_completed_at,agreements_completed,agreements_completed_at,handbook_acknowledged,handbook_acknowledged_at,documents_uploaded,documents_uploaded_at,status,step').eq('user_id', userId).maybeSingle(),
    primaryEnrollment
      ? supabase
          .from('enrollment_requirements')
          .select('id,requirement_type,title,description,due_date,priority,status,evidence_url,completed_at')
          .eq('enrollment_id', primaryEnrollment.enrollment_id)
          .order('due_date', { ascending: true, nullsFirst: false })
      : Promise.resolve({ data: [] as LearnerRequirement[], error: null }),
    supabase
      .from('license_agreement_acceptances')
      .select('agreement_type,document_version,accepted_at')
      .eq('user_id', userId),
    supabase
      .from('digital_binders')
      .select('id,status,enrollment_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileResult.error) warnings.push('Profile status could not be loaded.');
  if (progressResult.error) warnings.push('Onboarding progress could not be loaded.');
  if (requirementResult.error) warnings.push('Enrollment requirements could not be loaded.');
  if (agreementResult.error) warnings.push('Agreement status could not be loaded.');
  if (binderResult.error) warnings.push('Digital binder status could not be loaded.');

  const progress = progressResult.data;
  const signed = new Map(
    (agreementResult.data ?? []).map((row) => [
      `${row.agreement_type}:${row.document_version}`,
      row.accepted_at,
    ]),
  );
  const agreements = getRequiredAgreements(role).map((agreement) => ({
    ...agreement,
    signed: signed.has(`${agreement.type}:${agreement.version}`),
    acceptedAt: signed.get(`${agreement.type}:${agreement.version}`) ?? null,
  }));
  const requirements = (requirementResult.data ?? []) as LearnerRequirement[];
  const missingRequirements = requirements.filter((row) =>
    !['completed', 'verified', 'not_applicable'].includes(row.status),
  );
  const pendingRequirements = requirements.filter((row) => row.status === 'completed');
  const profileComplete = Boolean(progress?.profile_completed || (profileResult.data?.full_name && profileResult.data?.phone));
  const orientationComplete = progress?.is_complete === true;

  const onboardingSteps: LearnerOnboardingStep[] = [
    { id: 'profile', title: 'Complete your profile', description: 'Confirm your name and contact information.', href: '/lms/profile', status: profileComplete ? 'complete' : 'missing', completedAt: progress?.profile_completed_at ?? null, blocking: true },
    { id: 'documents', title: 'Submit required documents', description: requirements.length === 0 ? 'Required-document configuration is pending staff review.' : `${missingRequirements.length} requirement${missingRequirements.length === 1 ? '' : 's'} still need attention.`, href: '/lms/documents', status: requirements.length === 0 ? 'blocked' : missingRequirements.length > 0 ? 'missing' : pendingRequirements.length > 0 ? 'pending_review' : 'complete', completedAt: progress?.documents_uploaded_at ?? null, blocking: true },
    ...agreements.map((agreement) => ({ id: `agreement:${agreement.type}`, title: agreement.title, description: agreement.description, href: agreement.type === 'handbook' ? '/lms/handbook' : '/lms/agreements', status: agreement.signed ? 'complete' as const : 'missing' as const, completedAt: agreement.acceptedAt, blocking: true })),
    { id: 'orientation', title: 'Complete learner orientation', description: 'Review how training, support, progress, and credentials work.', href: '/lms/onboarding', status: orientationComplete ? 'complete' : 'missing', completedAt: progress?.completed_at ?? null, blocking: true },
    { id: 'course_assignment', title: 'Confirm course assignment', description: trainingEnrollment ? 'Your program or course assignment is recorded.' : 'A course or external-provider assignment has not been connected yet.', href: '/lms/courses', status: trainingEnrollment ? 'complete' : 'blocked', completedAt: null, blocking: true },
    { id: 'course_access', title: 'Open training access', description: trainingEnrollment?.continue_url && trainingEnrollment.continue_url !== '/lms/dashboard' ? 'Your next training destination is available.' : 'Training access is waiting on assignment or approval.', href: '/lms/courses', status: trainingEnrollment?.continue_url && trainingEnrollment.continue_url !== '/lms/dashboard' ? 'complete' : 'blocked', completedAt: null, blocking: true },
  ];

  const completed = onboardingSteps.filter((step) => step.status === 'complete').length;
  const nextRequiredAction = onboardingSteps.find((step) => step.blocking && step.status !== 'complete') ?? null;

  return {
    enrollments: enrollmentResult.enrollments,
    requirements,
    agreements,
    onboardingSteps,
    binder: binderResult.data ?? null,
    nextRequiredAction,
    onboardingPercent: onboardingSteps.length ? Math.round((completed / onboardingSteps.length) * 100) : 0,
    warnings,
  };
}
