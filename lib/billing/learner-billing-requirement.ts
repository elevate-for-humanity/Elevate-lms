import { isAffirmInvoiceAmount } from './invoice-checkout';
import {
  listApprenticeInvoices,
  type ApprenticeDashboardInvoice,
} from './apprentice-invoice-batch';

type Database = any;

type EnrollmentRow = {
  id: string;
  status?: string | null;
  enrollment_state?: string | null;
  funding_source?: string | null;
  funding_pathway?: string | null;
  program_slug?: string | null;
  total_program_fee?: number | null;
  balance_remaining?: number | null;
  amount_paid?: number | null;
  amount_paid_cents?: number | null;
  programs?: { title?: string | null } | { title?: string | null }[] | null;
};

type AuthorizationRow = {
  id: string;
  billing_schedule_id?: string | null;
  status: string;
  rejection_reason?: string | null;
};

type ScheduleRow = {
  provider_status?: string | null;
  provider_approval_url?: string | null;
  provider_subscription_id?: string | null;
  status?: string | null;
};

export type LearnerBillingRequirementStatus =
  | 'not_required'
  | 'configuration_required'
  | 'release_required'
  | 'release_submitted'
  | 'paypal_approval_required'
  | 'active';

export type LearnerBillingRequirement = {
  required: boolean;
  status: LearnerBillingRequirementStatus;
  enrollmentId: string | null;
  programName: string | null;
  authorizationId: string | null;
  authorizationStatus: string | null;
  rejectionReason: string | null;
  paypalApprovalUrl: string | null;
  invoices: ApprenticeDashboardInvoice[];
  affirmInvoice: ApprenticeDashboardInvoice | null;
};

const ACTIVE_ENROLLMENT_STATES = new Set(['active', 'approved', 'enrolled', 'in_progress']);
const SELF_PAY_VALUES = new Set(['self_pay', 'self-pay', 'self pay']);
const NON_STUDENT_PAY_VALUES = new Set([
  'waived',
  'wioa',
  'wrg',
  'jri',
  'grant',
  'funded',
  'scholarship',
  'employer_paid',
  'employer-sponsored',
  'sponsored',
]);

function normalized(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function programTitle(enrollment: EnrollmentRow): string | null {
  const program = Array.isArray(enrollment.programs)
    ? enrollment.programs[0]
    : enrollment.programs;
  return program?.title || enrollment.program_slug?.replace(/[-_]/g, ' ') || null;
}

function isPaidInFull(enrollment: EnrollmentRow): boolean {
  const hasTotal =
    enrollment.total_program_fee !== null && enrollment.total_program_fee !== undefined;
  const hasBalance =
    enrollment.balance_remaining !== null && enrollment.balance_remaining !== undefined;
  const total = hasTotal ? Number(enrollment.total_program_fee) : Number.NaN;
  const balance = hasBalance ? Number(enrollment.balance_remaining) : Number.NaN;
  const amountPaid = Math.max(
    Number(enrollment.amount_paid || 0),
    Number(enrollment.amount_paid_cents || 0) / 100,
  );
  if (Number.isFinite(balance) && balance === 0 && (total > 0 || amountPaid > 0)) return true;
  return Number.isFinite(total) && total > 0 && amountPaid >= total;
}

export function resolveLearnerBillingRequirement(input: {
  role?: string | null;
  enrollments: EnrollmentRow[];
  authorization?: AuthorizationRow | null;
  schedule?: ScheduleRow | null;
  invoices?: ApprenticeDashboardInvoice[];
}): LearnerBillingRequirement {
  const role = normalized(input.role);
  const eligibleEnrollments = input.enrollments.filter((row) => {
    const state = normalized(row.enrollment_state || row.status);
    if (!ACTIVE_ENROLLMENT_STATES.has(state)) return false;
    const funding = normalized(row.funding_source || row.funding_pathway);
    if (NON_STUDENT_PAY_VALUES.has(funding)) return false;
    const apprentice = role === 'apprentice' || normalized(row.program_slug).includes('apprent');
    return apprentice || SELF_PAY_VALUES.has(funding);
  });
  const enrollment =
    eligibleEnrollments.find((row) => !isPaidInFull(row)) || eligibleEnrollments[0];
  const invoices = input.invoices || [];
  const affirmInvoice =
    invoices.find(
      (invoice) =>
        ['open', 'past_due'].includes(normalized(invoice.status)) &&
        isAffirmInvoiceAmount(invoice.amountCents),
    ) || null;

  if (!enrollment || eligibleEnrollments.every(isPaidInFull)) {
    return {
      required: false,
      status: 'not_required',
      enrollmentId: enrollment?.id || null,
      programName: enrollment ? programTitle(enrollment) : null,
      authorizationId: null,
      authorizationStatus: null,
      rejectionReason: null,
      paypalApprovalUrl: null,
      invoices,
      affirmInvoice,
    };
  }

  const authorization = input.authorization || null;
  const schedule = input.schedule || null;
  let status: LearnerBillingRequirementStatus = 'configuration_required';
  if (authorization?.status === 'submitted') status = 'release_submitted';
  else if (authorization?.status === 'requested' || authorization?.status === 'rejected') {
    status = 'release_required';
  } else if (authorization?.status === 'approved') {
    const paypalActive =
      schedule?.status === 'active' &&
      schedule.provider_status === 'active' &&
      Boolean(schedule.provider_subscription_id);
    status = paypalActive ? 'active' : 'paypal_approval_required';
  }

  return {
    required: true,
    status,
    enrollmentId: enrollment.id,
    programName: programTitle(enrollment),
    authorizationId: authorization?.id || null,
    authorizationStatus: authorization?.status || null,
    rejectionReason: authorization?.rejection_reason || null,
    paypalApprovalUrl: schedule?.provider_approval_url || null,
    invoices,
    affirmInvoice,
  };
}

export async function loadLearnerBillingRequirement(
  db: Database,
  userId: string,
): Promise<LearnerBillingRequirement> {
  const [profileResult, enrollmentResult] = await Promise.all([
    db.from('profiles').select('role').eq('id', userId).maybeSingle(),
    db
      .from('program_enrollments')
      .select(
        'id,status,enrollment_state,funding_source,funding_pathway,program_slug,total_program_fee,balance_remaining,amount_paid,amount_paid_cents,programs(title)',
      )
      .or(`user_id.eq.${userId},student_id.eq.${userId}`)
      .order('created_at', { ascending: false }),
  ]);
  if (profileResult.error) {
    throw new Error(`Could not load learner role: ${profileResult.error.message}`);
  }
  if (enrollmentResult.error) {
    throw new Error(`Could not load learner billing enrollment: ${enrollmentResult.error.message}`);
  }

  const enrollments = (enrollmentResult.data || []) as EnrollmentRow[];
  const preliminary = resolveLearnerBillingRequirement({
    role: profileResult.data?.role,
    enrollments,
  });
  if (!preliminary.required) return preliminary;

  const [authorizationResult, invoices] = await Promise.all([
    db
      .from('billing_migration_authorizations')
      .select('id,billing_schedule_id,status,rejection_reason')
      .eq('user_id', userId)
      .neq('status', 'superseded')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    listApprenticeInvoices(db, userId),
  ]);
  if (authorizationResult.error) {
    throw new Error(`Could not load recurring-payment release: ${authorizationResult.error.message}`);
  }

  const authorization = authorizationResult.data as AuthorizationRow | null;
  const scheduleResult = authorization?.billing_schedule_id
    ? await db
        .from('billing_schedules')
        .select('status,provider_status,provider_approval_url,provider_subscription_id')
        .eq('id', authorization.billing_schedule_id)
        .maybeSingle()
    : { data: null, error: null };
  if (scheduleResult.error) {
    throw new Error(`Could not load PayPal billing agreement: ${scheduleResult.error.message}`);
  }

  return resolveLearnerBillingRequirement({
    role: profileResult.data?.role,
    enrollments,
    authorization,
    schedule: scheduleResult.data as ScheduleRow | null,
    invoices,
  });
}
