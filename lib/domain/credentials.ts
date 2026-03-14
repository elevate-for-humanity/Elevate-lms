/**
 * Canonical credential domain types and mappers.
 *
 * All code consuming credential_registry, learner_credentials, credential_attempts,
 * learner_exam_eligibility, exam_schedule_requests, or exam_funding_authorizations
 * should import from here. Raw DB shapes, status normalization, and lifecycle
 * translation live here once.
 *
 * Lifecycle state machine:
 *   not_eligible → eligible → payment_required → payment_pending → payment_approved
 *   → scheduled → attempted → passed | failed
 *   passed → credential_pending_verification → credential_verified → certificate_issued
 *
 * Funding guard (hard rule):
 *   Checkout is only bypassed when:
 *     funding_source !== 'self_pay' AND funding_status === 'approved'
 *   Everything else routes to learner checkout.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle state machine
// ─────────────────────────────────────────────────────────────────────────────

export type CredentialLifecycleState =
  | 'not_eligible'
  | 'eligible'
  | 'payment_required'
  | 'payment_pending'
  | 'payment_approved'
  | 'scheduled'
  | 'attempted'
  | 'passed'
  | 'failed'
  | 'credential_pending_verification'
  | 'credential_verified'
  | 'certificate_issued';

const LIFECYCLE_ORDER: CredentialLifecycleState[] = [
  'not_eligible', 'eligible', 'payment_required', 'payment_pending',
  'payment_approved', 'scheduled', 'attempted', 'passed', 'failed',
  'credential_pending_verification', 'credential_verified', 'certificate_issued',
];

/** Returns true if `from` can legally advance to `to`. */
export function canAdvance(
  from: CredentialLifecycleState,
  to: CredentialLifecycleState
): boolean {
  if (from === 'failed' && to === 'eligible') return true; // retry path
  const fi = LIFECYCLE_ORDER.indexOf(from);
  const ti = LIFECYCLE_ORDER.indexOf(to);
  return fi !== -1 && ti !== -1 && ti > fi;
}

// ─────────────────────────────────────────────────────────────────────────────
// Funding decision model
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Who is responsible for covering the exam/credential fee.
 * funding_source answers: who is supposed to cover this
 * funding_status answers: has that coverage been authorized or completed
 */
export type FundingSource =
  | 'self_pay'
  | 'elevate'
  | 'grant'
  | 'employer'
  | 'partner'
  | 'scholarship';

export type FundingStatus =
  | 'unresolved'
  | 'pending'
  | 'approved'
  | 'denied'
  | 'paid'
  | 'waived';

export interface FundingDecision {
  fundingSource: FundingSource;
  fundingStatus: FundingStatus;
  requiresCheckout: boolean;
  amountCents: number | null;
  authorizationId: string | null;
  reason: string;
}

/**
 * Hard guard: checkout is only bypassed when source is non-self-pay AND status is approved.
 * Call this before rendering /lms/payments/checkout.
 */
export function requiresLearnerCheckout(decision: FundingDecision): boolean {
  if (decision.fundingSource === 'self_pay') return true;
  if (decision.fundingStatus !== 'approved') return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Raw DB shapes
// ─────────────────────────────────────────────────────────────────────────────

export interface RawCredentialRow {
  id: string;
  name: string | null;
  abbreviation: string | null;
  issuer_type: string | null;
  issuing_authority: string | null;
  credential_stack: string | null;
  competency_area: string | null;
  stack_level: number | null;
  proctor_authority: string | null;
  description: string | null;
  is_active: boolean | null;
  is_published: boolean | null;
  wioa_eligible: boolean | null;
  requires_exam: boolean | null;
  exam_type: string | null;
  renewal_period_months: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface RawLearnerCredentialRow {
  id: string;
  learner_id: string | null;
  credential_id: string | null;
  credential_name: string | null;
  credential_type: string | null;
  status: string | null;
  issued_at: string | null;
  expires_at: string | null;
  certificate_id: string | null;
  verification_code: string | null;
  verification_url: string | null;
  certifying_body: string | null;
  certificate_number: string | null;
  proctor_id: string | null;
  exam_date: string | null;
  exam_type: string | null;
  cohort_id: string | null;
  course_id: string | null;
  program_id: string | null;
  badge_url: string | null;
  certificate_url: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
}

export interface RawCredentialAttemptRow {
  id: string;
  learner_id: string;
  credential_id: string;
  program_id: string | null;
  attempt_number: number;
  attempted_at: string;
  completed_at: string | null;
  score: number | null;
  passed: boolean | null;
  proctor_id: string | null;
  proctor_notes: string | null;
  credential_issued_id: string | null;
  metadata: Record<string, unknown> | null;
}

export interface RawExamEligibilityRow {
  id: string;
  learner_id: string;
  credential_id: string;
  domain_key: string;
  sims_passed: number;
  sims_required: number;
  modules_completed: number;
  modules_required: number;
  is_eligible: boolean;
  eligible_at: string | null;
  last_evaluated_at: string;
}

export interface RawExamScheduleRequestRow {
  id: string;
  learner_id: string;
  credential_id: string;
  cohort_id: string | null;
  exam_type: string;
  certifying_body: string;
  exam_format: string;
  requested_date: string | null;
  status: string;
  scheduled_exam_session_id: string | null;
  eligibility_verified_at: string | null;
  eligibility_snapshot: Record<string, unknown> | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

/** exam_funding_authorizations — see migration 20260321000001 */
export interface RawExamFundingAuthorizationRow {
  id: string;
  learner_id: string;
  credential_id: string;
  credential_attempt_id: string | null;
  program_id: string | null;
  funding_source: string;
  funding_status: string;
  funded_amount_cents: number | null;
  funding_notes: string | null;
  funding_approved_by: string | null;
  funding_approved_at: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Canonical app-facing types
// ─────────────────────────────────────────────────────────────────────────────

export type IssuerType = 'elevate_issued' | 'elevate_proctored' | 'partner_delivered';

export interface CredentialRecord {
  id: string;
  name: string;
  abbreviation: string | null;
  issuerType: IssuerType;
  issuingAuthority: string;
  credentialStack: string | null;
  competencyArea: string | null;
  stackLevel: number | null;
  proctorAuthority: string | null;
  description: string;
  isActive: boolean;
  isPublished: boolean;
  wioaEligible: boolean;
  requiresExam: boolean;
  examType: string | null;
  renewalPeriodMonths: number | null;
  metadata: Record<string, unknown>;
}

export type LearnerCredentialStatus = 'active' | 'expired' | 'revoked' | 'suspended';

export interface LearnerCredentialRecord {
  id: string;
  learnerId: string;
  credentialId: string | null;
  credentialName: string;
  credentialType: string;
  status: LearnerCredentialStatus;
  issuedAt: string | null;
  expiresAt: string | null;
  verificationCode: string | null;
  verificationUrl: string | null;
  certifyingBody: string | null;
  certificateNumber: string | null;
  proctorId: string | null;
  examDate: string | null;
  examType: string | null;
  cohortId: string | null;
  programId: string | null;
  badgeUrl: string | null;
  certificateUrl: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
}

export type ExamScheduleStatus =
  | 'pending' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface CredentialAttemptRecord {
  id: string;
  learnerId: string;
  credentialId: string;
  programId: string | null;
  attemptNumber: number;
  attemptedAt: string;
  completedAt: string | null;
  score: number | null;
  passed: boolean | null;
  proctorId: string | null;
  credentialIssuedId: string | null;
  metadata: Record<string, unknown>;
}

export interface ExamEligibilityRecord {
  id: string;
  learnerId: string;
  credentialId: string;
  domainKey: string;
  simsPassed: number;
  simsRequired: number;
  modulesCompleted: number;
  modulesRequired: number;
  isEligible: boolean;
  eligibleAt: string | null;
  lastEvaluatedAt: string;
}

export interface ExamFundingAuthorization {
  id: string;
  learnerId: string;
  credentialId: string;
  credentialAttemptId: string | null;
  programId: string | null;
  fundingSource: FundingSource;
  fundingStatus: FundingStatus;
  fundedAmountCents: number | null;
  fundingNotes: string | null;
  fundingApprovedBy: string | null;
  fundingApprovedAt: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalizers
// ─────────────────────────────────────────────────────────────────────────────

const VALID_ISSUER_TYPES: IssuerType[] = [
  'elevate_issued', 'elevate_proctored', 'partner_delivered',
];

function normalizeIssuerType(raw: string | null): IssuerType {
  if (raw && (VALID_ISSUER_TYPES as string[]).includes(raw)) return raw as IssuerType;
  return 'partner_delivered';
}

const VALID_LEARNER_STATUSES: LearnerCredentialStatus[] = [
  'active', 'expired', 'revoked', 'suspended',
];

function normalizeLearnerStatus(raw: string | null): LearnerCredentialStatus {
  if (raw && (VALID_LEARNER_STATUSES as string[]).includes(raw)) return raw as LearnerCredentialStatus;
  return 'active';
}

const VALID_FUNDING_SOURCES: FundingSource[] = [
  'self_pay', 'elevate', 'grant', 'employer', 'partner', 'scholarship',
];

export function normalizeFundingSource(raw: string | null): FundingSource {
  if (raw && (VALID_FUNDING_SOURCES as string[]).includes(raw)) return raw as FundingSource;
  return 'self_pay'; // safe fallback — never accidentally sponsor
}

const VALID_FUNDING_STATUSES: FundingStatus[] = [
  'unresolved', 'pending', 'approved', 'denied', 'paid', 'waived',
];

export function normalizeFundingStatus(raw: string | null): FundingStatus {
  if (raw && (VALID_FUNDING_STATUSES as string[]).includes(raw)) return raw as FundingStatus;
  return 'unresolved';
}

// ─────────────────────────────────────────────────────────────────────────────
// Mappers
// ─────────────────────────────────────────────────────────────────────────────

export function mapCredentialRow(row: RawCredentialRow): CredentialRecord {
  return {
    id: row.id,
    name: row.name ?? 'Unnamed Credential',
    abbreviation: row.abbreviation ?? null,
    issuerType: normalizeIssuerType(row.issuer_type),
    issuingAuthority: row.issuing_authority ?? 'Unknown',
    credentialStack: row.credential_stack ?? null,
    competencyArea: row.competency_area ?? null,
    stackLevel: row.stack_level ?? null,
    proctorAuthority: row.proctor_authority ?? null,
    description: row.description ?? '',
    isActive: row.is_active ?? true,
    isPublished: row.is_published ?? false,
    wioaEligible: row.wioa_eligible ?? false,
    requiresExam: row.requires_exam ?? false,
    examType: row.exam_type ?? null,
    renewalPeriodMonths: row.renewal_period_months ?? null,
    metadata: row.metadata ?? {},
  };
}

export function mapLearnerCredentialRow(row: RawLearnerCredentialRow): LearnerCredentialRecord {
  return {
    id: row.id,
    learnerId: row.learner_id ?? '',
    credentialId: row.credential_id ?? null,
    credentialName: row.credential_name ?? 'Unnamed Credential',
    credentialType: row.credential_type ?? 'Certificate',
    status: normalizeLearnerStatus(row.status),
    issuedAt: row.issued_at ?? null,
    expiresAt: row.expires_at ?? null,
    verificationCode: row.verification_code ?? null,
    verificationUrl: row.verification_url ?? null,
    certifyingBody: row.certifying_body ?? null,
    certificateNumber: row.certificate_number ?? null,
    proctorId: row.proctor_id ?? null,
    examDate: row.exam_date ?? null,
    examType: row.exam_type ?? null,
    cohortId: row.cohort_id ?? null,
    programId: row.program_id ?? null,
    badgeUrl: row.badge_url ?? null,
    certificateUrl: row.certificate_url ?? null,
    notes: row.notes ?? null,
    metadata: row.metadata ?? {},
  };
}

export function mapCredentialAttemptRow(row: RawCredentialAttemptRow): CredentialAttemptRecord {
  return {
    id: row.id,
    learnerId: row.learner_id,
    credentialId: row.credential_id,
    programId: row.program_id ?? null,
    attemptNumber: row.attempt_number,
    attemptedAt: row.attempted_at,
    completedAt: row.completed_at ?? null,
    score: row.score ?? null,
    passed: row.passed ?? null,
    proctorId: row.proctor_id ?? null,
    credentialIssuedId: row.credential_issued_id ?? null,
    metadata: row.metadata ?? {},
  };
}

export function mapExamEligibilityRow(row: RawExamEligibilityRow): ExamEligibilityRecord {
  return {
    id: row.id,
    learnerId: row.learner_id,
    credentialId: row.credential_id,
    domainKey: row.domain_key,
    simsPassed: row.sims_passed,
    simsRequired: row.sims_required,
    modulesCompleted: row.modules_completed,
    modulesRequired: row.modules_required,
    isEligible: row.is_eligible,
    eligibleAt: row.eligible_at ?? null,
    lastEvaluatedAt: row.last_evaluated_at,
  };
}

export function mapExamFundingAuthorizationRow(
  row: RawExamFundingAuthorizationRow
): ExamFundingAuthorization {
  return {
    id: row.id,
    learnerId: row.learner_id,
    credentialId: row.credential_id,
    credentialAttemptId: row.credential_attempt_id ?? null,
    programId: row.program_id ?? null,
    fundingSource: normalizeFundingSource(row.funding_source),
    fundingStatus: normalizeFundingStatus(row.funding_status),
    fundedAmountCents: row.funded_amount_cents ?? null,
    fundingNotes: row.funding_notes ?? null,
    fundingApprovedBy: row.funding_approved_by ?? null,
    fundingApprovedAt: row.funding_approved_at ?? null,
    stripeCheckoutSessionId: row.stripe_checkout_session_id ?? null,
    stripePaymentIntentId: row.stripe_payment_intent_id ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Lifecycle resolver
// Translates raw DB state across multiple tables into a single lifecycle state.
// ─────────────────────────────────────────────────────────────────────────────

export interface LifecycleInput {
  eligibility: ExamEligibilityRecord | null;
  attempt: CredentialAttemptRecord | null;
  funding: ExamFundingAuthorization | null;
  scheduleRequest: { status: ExamScheduleStatus } | null;
  learnerCredential: LearnerCredentialRecord | null;
  hasCertificate: boolean;
}

/**
 * Derives the canonical lifecycle state from raw DB records.
 * This is the single translation point — routes and UI read this, not raw tables.
 */
export function resolveLifecycleState(input: LifecycleInput): CredentialLifecycleState {
  const { eligibility, attempt, funding, scheduleRequest, learnerCredential, hasCertificate } = input;

  if (hasCertificate) return 'certificate_issued';
  if (learnerCredential?.status === 'active') return 'credential_verified';
  if (attempt?.passed === false) return 'failed';
  if (attempt?.passed === true && !learnerCredential) return 'credential_pending_verification';
  if (attempt?.completedAt && attempt.passed === null) return 'attempted';

  if (scheduleRequest?.status === 'confirmed' || scheduleRequest?.status === 'scheduled') {
    return 'scheduled';
  }

  if (!eligibility?.isEligible) return 'not_eligible';

  // Eligible — resolve funding
  if (!funding) return 'payment_required';

  if (funding.fundingStatus === 'paid' || funding.fundingStatus === 'waived') return 'payment_approved';

  if (funding.fundingSource !== 'self_pay' && funding.fundingStatus === 'approved') return 'payment_approved';

  if (funding.fundingStatus === 'pending' && funding.fundingSource !== 'self_pay') return 'payment_pending';

  return 'payment_required';
}

/**
 * Returns the next required action for the learner, in plain language.
 * Used by /lms/certification to drive the UI.
 */
export function getNextAction(state: CredentialLifecycleState): string {
  switch (state) {
    case 'not_eligible':                    return 'Complete required training modules and simulations.';
    case 'eligible':                        return 'You are eligible. Proceed to exam registration.';
    case 'payment_required':                return 'Pay your exam fee to schedule your exam.';
    case 'payment_pending':                 return 'Your funding request is under review. Check back soon.';
    case 'payment_approved':                return 'Payment confirmed. Schedule your exam.';
    case 'scheduled':                       return 'Your exam is scheduled. Review your study materials.';
    case 'attempted':                       return 'Exam submitted. Awaiting results.';
    case 'passed':                          return 'You passed. Upload your credential proof.';
    case 'failed':                          return 'Exam not passed. Review materials and retry when ready.';
    case 'credential_pending_verification': return 'Credential uploaded. Awaiting staff verification.';
    case 'credential_verified':             return 'Credential verified. Your certificate is being issued.';
    case 'certificate_issued':              return 'Complete. Your certificate is available.';
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Guards
// ─────────────────────────────────────────────────────────────────────────────

export function assertIssuable(c: LearnerCredentialRecord): void {
  const missing: string[] = [];
  if (!c.learnerId) missing.push('learner_id');
  if (!c.credentialName) missing.push('credential_name');
  if (missing.length > 0) {
    throw new Error(`Cannot issue credential: missing required fields: ${missing.join(', ')}`);
  }
}

export function isVerifiable(c: LearnerCredentialRecord): boolean {
  if (c.status !== 'active') return false;
  if (c.expiresAt && new Date(c.expiresAt) < new Date()) return false;
  return true;
}
