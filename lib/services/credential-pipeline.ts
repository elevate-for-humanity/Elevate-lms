/**
 * Credential pipeline orchestrator.
 *
 * This is the only place that advances a learner through the credential lifecycle.
 * Routes call these functions — they do not write to credential tables directly.
 *
 * Table responsibilities:
 *   learner_exam_eligibility      → gatekeeper (read-only here; written by evaluate_exam_eligibility())
 *   exam_funding_authorizations   → funding decision (written here)
 *   credential_attempts           → exam lifecycle state (written here)
 *   exam_schedule_requests        → scheduling (written here)
 *   credential_delivery_queue     → outbound partner handoff (written here)
 *   learner_credentials           → verified external credential record (written here)
 *   certificates                  → internal completion document (written here)
 *   certifying_body_routing       → partner routing rules (read-only here)
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { setAuditContext } from '@/lib/audit-context';
import {
  type FundingSource,
  type FundingDecision,
  type CredentialLifecycleState,
  type LifecycleInput,
  type ExamFundingAuthorization,
  mapExamFundingAuthorizationRow,
  mapExamEligibilityRow,
  mapCredentialAttemptRow,
  mapLearnerCredentialRow,
  normalizeFundingSource,
  normalizeFundingStatus,
  requiresLearnerCheckout,
  resolveLifecycleState,
} from '@/lib/domain/credentials';

// ─────────────────────────────────────────────────────────────────────────────
// resolvePaymentResponsibility
//
// Determines who pays for the exam fee for a given learner + credential.
// Resolution order:
//   1. Explicit exam_funding_authorizations record (learner-level override)
//   2. program_credentials.exam_fee_payer default (program-level policy)
//   3. Fallback: self_pay / unresolved
//
// Never returns a sponsored decision unless it is explicitly approved.
// ─────────────────────────────────────────────────────────────────────────────

export async function resolvePaymentResponsibility(
  learnerId: string,
  credentialId: string,
  programId: string | null,
  credentialAttemptId?: string | null
): Promise<FundingDecision> {
  const db = createAdminClient();
  if (!db) {
    return {
      fundingSource: 'self_pay',
      fundingStatus: 'unresolved',
      requiresCheckout: true,
      amountCents: null,
      authorizationId: null,
      reason: 'Database unavailable — defaulting to self_pay',
    };
  }

  // 1. Check for explicit learner-level authorization
  let query = db
    .from('exam_funding_authorizations')
    .select('*')
    .eq('learner_id', learnerId)
    .eq('credential_id', credentialId);

  if (credentialAttemptId) {
    query = query.eq('credential_attempt_id', credentialAttemptId);
  } else {
    query = query.is('credential_attempt_id', null);
  }

  const { data: authRow } = await query.maybeSingle();

  if (authRow) {
    const auth = mapExamFundingAuthorizationRow(authRow);
    const decision: FundingDecision = {
      fundingSource: auth.fundingSource,
      fundingStatus: auth.fundingStatus,
      requiresCheckout: requiresLearnerCheckout({
        fundingSource: auth.fundingSource,
        fundingStatus: auth.fundingStatus,
        requiresCheckout: false,
        amountCents: auth.fundedAmountCents,
        authorizationId: auth.id,
        reason: '',
      }),
      amountCents: auth.fundedAmountCents,
      authorizationId: auth.id,
      reason: `Explicit authorization: ${auth.fundingSource} / ${auth.fundingStatus}`,
    };
    return decision;
  }

  // 2. Check program-level default
  if (programId) {
    const { data: pc } = await db
      .from('program_credentials')
      .select('exam_fee_payer, exam_fee_cents')
      .eq('program_id', programId)
      .eq('credential_id', credentialId)
      .maybeSingle();

    if (pc?.exam_fee_payer && pc.exam_fee_payer !== 'self_pay') {
      const source = normalizeFundingSource(pc.exam_fee_payer);
      // Program default is not an approval — it is a policy. Status is unresolved
      // until staff explicitly approves or the learner pays.
      return {
        fundingSource: source,
        fundingStatus: 'unresolved',
        requiresCheckout: true, // unresolved non-self-pay still requires checkout or admin action
        amountCents: pc.exam_fee_cents ?? null,
        authorizationId: null,
        reason: `Program default: ${source} (pending authorization)`,
      };
    }

    if (pc?.exam_fee_payer === 'self_pay') {
      return {
        fundingSource: 'self_pay',
        fundingStatus: 'unresolved',
        requiresCheckout: true,
        amountCents: pc.exam_fee_cents ?? null,
        authorizationId: null,
        reason: 'Program default: self_pay',
      };
    }
  }

  // 3. Fallback
  return {
    fundingSource: 'self_pay',
    fundingStatus: 'unresolved',
    requiresCheckout: true,
    amountCents: null,
    authorizationId: null,
    reason: 'No funding record found — defaulting to self_pay',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// getLearnerCredentialLifecycle
//
// Reads all relevant tables for a learner + credential and returns the
// canonical lifecycle state. This is the read model for /lms/certification.
// ─────────────────────────────────────────────────────────────────────────────

export async function getLearnerCredentialLifecycle(
  learnerId: string,
  credentialId: string,
  programId?: string | null
): Promise<{ state: CredentialLifecycleState; input: LifecycleInput; funding: FundingDecision }> {
  const db = createAdminClient();

  const [eligibilityRes, attemptRes, fundingRes, scheduleRes, lcRes, certRes] = await Promise.all([
    db?.from('learner_exam_eligibility')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('credential_id', credentialId)
      .order('last_evaluated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    db?.from('credential_attempts')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('credential_id', credentialId)
      .order('attempt_number', { ascending: false })
      .limit(1)
      .maybeSingle(),

    db?.from('exam_funding_authorizations')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('credential_id', credentialId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    db?.from('exam_schedule_requests')
      .select('status')
      .eq('learner_id', learnerId)
      .eq('credential_id', credentialId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),

    db?.from('learner_credentials')
      .select('*')
      .eq('learner_id', learnerId)
      .eq('credential_id', credentialId)
      .eq('status', 'active')
      .maybeSingle(),

    db?.from('certificates')
      .select('id')
      .eq('user_id', learnerId)
      .eq('program_id', programId ?? '')
      .maybeSingle(),
  ]);

  const eligibility = eligibilityRes?.data ? mapExamEligibilityRow(eligibilityRes.data) : null;
  const attempt = attemptRes?.data ? mapCredentialAttemptRow(attemptRes.data) : null;
  const fundingAuth: ExamFundingAuthorization | null = fundingRes?.data
    ? mapExamFundingAuthorizationRow(fundingRes.data)
    : null;
  const scheduleRequest = scheduleRes?.data ?? null;
  const learnerCredential = lcRes?.data ? mapLearnerCredentialRow(lcRes.data) : null;
  const hasCertificate = !!certRes?.data;

  const input: LifecycleInput = {
    eligibility,
    attempt,
    funding: fundingAuth,
    scheduleRequest: scheduleRequest as { status: import('@/lib/domain/credentials').ExamScheduleStatus } | null,
    learnerCredential,
    hasCertificate,
  };

  const state = resolveLifecycleState(input);

  const funding = await resolvePaymentResponsibility(
    learnerId,
    credentialId,
    programId ?? null,
    attempt?.id ?? null
  );

  return { state, input, funding };
}

// ─────────────────────────────────────────────────────────────────────────────
// startCredentialAttempt
//
// Called after course completion when the learner is eligible.
// Creates a credential_attempts record and an exam_funding_authorization.
// Does NOT advance to checkout — caller reads the returned FundingDecision.
// ─────────────────────────────────────────────────────────────────────────────

export async function startCredentialAttempt(
  learnerId: string,
  credentialId: string,
  programId: string | null
): Promise<{ attemptId: string; funding: FundingDecision } | { error: string }> {
  const db = createAdminClient();
  if (!db) return { error: 'Database unavailable' };

  // Verify eligibility before creating attempt
  const { data: eligibility } = await db
    .from('learner_exam_eligibility')
    .select('is_eligible')
    .eq('learner_id', learnerId)
    .eq('credential_id', credentialId)
    .maybeSingle();

  if (!eligibility?.is_eligible) {
    return { error: 'Learner is not eligible for this credential' };
  }

  // Get current attempt count
  const { count } = await db
    .from('credential_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('learner_id', learnerId)
    .eq('credential_id', credentialId);

  const attemptNumber = (count ?? 0) + 1;

  const { data: attempt, error: attemptError } = await db
    .from('credential_attempts')
    .insert({
      learner_id: learnerId,
      credential_id: credentialId,
      program_id: programId,
      attempt_number: attemptNumber,
      attempted_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (attemptError || !attempt) {
    return { error: 'Failed to create credential attempt' };
  }

  const funding = await resolvePaymentResponsibility(
    learnerId,
    credentialId,
    programId,
    attempt.id
  );

  // If program default is non-self-pay, create a pending authorization record
  // so staff can see it and approve/deny without the learner having to do anything.
  if (funding.fundingSource !== 'self_pay' && !funding.authorizationId) {
    await db.from('exam_funding_authorizations').insert({
      learner_id: learnerId,
      credential_id: credentialId,
      credential_attempt_id: attempt.id,
      program_id: programId,
      funding_source: funding.fundingSource,
      funding_status: 'pending',
      funded_amount_cents: funding.amountCents,
      funding_notes: funding.reason,
    });

    // Re-resolve with the new record
    const updatedFunding = await resolvePaymentResponsibility(
      learnerId,
      credentialId,
      programId,
      attempt.id
    );
    return { attemptId: attempt.id, funding: updatedFunding };
  }

  return { attemptId: attempt.id, funding };
}

// ─────────────────────────────────────────────────────────────────────────────
// markPaymentSucceeded
//
// Called by Stripe webhook after successful checkout.
// Updates exam_funding_authorizations and advances funding_status to 'paid'.
// ─────────────────────────────────────────────────────────────────────────────

export async function markPaymentSucceeded(
  stripeCheckoutSessionId: string,
  stripePaymentIntentId: string
): Promise<{ ok: boolean; error?: string }> {
  const db = createAdminClient();
  if (!db) return { ok: false, error: 'Database unavailable' };

  const { error } = await db
    .from('exam_funding_authorizations')
    .update({
      funding_status: 'paid',
      stripe_payment_intent_id: stripePaymentIntentId,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_checkout_session_id', stripeCheckoutSessionId);

  if (error) return { ok: false, error: 'Failed to update funding authorization' };
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// approveFundingAuthorization
//
// Admin/staff action. Sets funding_status to 'approved' for a sponsored learner.
// Only call this for non-self-pay sources.
// ─────────────────────────────────────────────────────────────────────────────

export async function approveFundingAuthorization(
  authorizationId: string,
  approvedBy: string,
  notes?: string
): Promise<{ ok: boolean; error?: string }> {
  const db = createAdminClient();
  if (!db) return { ok: false, error: 'Database unavailable' };

  const { data: auth } = await db
    .from('exam_funding_authorizations')
    .select('funding_source')
    .eq('id', authorizationId)
    .single();

  if (auth?.funding_source === 'self_pay') {
    return { ok: false, error: 'Cannot approve a self_pay authorization — learner must pay via checkout' };
  }

  const { error } = await db
    .from('exam_funding_authorizations')
    .update({
      funding_status: 'approved',
      funding_approved_by: approvedBy,
      funding_approved_at: new Date().toISOString(),
      funding_notes: notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', authorizationId);

  if (error) return { ok: false, error: 'Failed to approve funding authorization' };
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// queueCredentialDelivery
//
// After payment is confirmed or sponsorship approved, queue the outbound
// partner handoff through credential_delivery_queue.
// ─────────────────────────────────────────────────────────────────────────────

export async function queueCredentialDelivery(
  learnerId: string,
  credentialId: string,
  enrollmentId: string,
  courseId: string,
  courseName: string,
  providerId: string,
  providerName: string,
  studentEmail: string,
  studentName: string
): Promise<{ ok: boolean; error?: string }> {
  const db = createAdminClient();
  if (!db) return { ok: false, error: 'Database unavailable' };

  const { error } = await db.from('credential_delivery_queue').insert({
    enrollment_id: enrollmentId,
    course_id: courseId,
    course_name: courseName,
    provider_id: providerId,
    provider_name: providerName,
    student_id: learnerId,
    student_email: studentEmail,
    student_name: studentName,
    status: 'pending',
  });

  if (error) return { ok: false, error: 'Failed to queue credential delivery' };
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// verifyLearnerCredential
//
// Admin/staff action after learner uploads credential proof.
// Writes to learner_credentials and triggers certificate issuance.
// ─────────────────────────────────────────────────────────────────────────────

export async function verifyLearnerCredential(
  learnerId: string,
  credentialId: string,
  programId: string | null,
  attemptId: string,
  verifiedBy: string,
  opts: {
    examScore?: number;
    certifyingBody?: string;
    certificateNumber?: string;
    examDate?: string;
    badgeUrl?: string;
    certificateUrl?: string;
  } = {}
): Promise<{ ok: boolean; learnerCredentialId?: string; error?: string }> {
  const db = createAdminClient();
  if (!db) return { ok: false, error: 'Database unavailable' };

  await setAuditContext(db, { actorUserId: verifiedBy, systemActor: 'credential_pipeline' });

  // Mark attempt as passed
  await db
    .from('credential_attempts')
    .update({ passed: true, completed_at: new Date().toISOString(), score: opts.examScore ?? null })
    .eq('id', attemptId);

  // Create learner_credentials record
  const { data: lc, error: lcError } = await db
    .from('learner_credentials')
    .insert({
      learner_id: learnerId,
      credential_id: credentialId,
      program_id: programId,
      issued_at: new Date().toISOString(),
      issued_by: verifiedBy,
      status: 'active',
      exam_score: opts.examScore ?? null,
      exam_attempt_id: attemptId,
      certifying_body: opts.certifyingBody ?? null,
      certificate_number: opts.certificateNumber ?? null,
      exam_date: opts.examDate ?? null,
      badge_url: opts.badgeUrl ?? null,
      certificate_url: opts.certificateUrl ?? null,
    })
    .select('id')
    .single();

  if (lcError || !lc) return { ok: false, error: 'Failed to create learner credential record' };

  // Link attempt to issued credential
  await db
    .from('credential_attempts')
    .update({ credential_issued_id: lc.id })
    .eq('id', attemptId);

  return { ok: true, learnerCredentialId: lc.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// issueCompletionCertificate
//
// Final step. Creates the internal certificates record.
// Only call after verifyLearnerCredential succeeds.
// ─────────────────────────────────────────────────────────────────────────────

export async function issueCompletionCertificate(
  learnerId: string,
  programId: string,
  enrollmentId: string,
  courseName: string,
  programName: string,
  hoursCompleted: number,
  issuedBy: string = 'Elevate for Humanity'
): Promise<{ ok: boolean; certificateId?: string; error?: string }> {
  const db = createAdminClient();
  if (!db) return { ok: false, error: 'Database unavailable' };

  // Idempotency check — do not double-issue
  const { data: existing } = await db
    .from('certificates')
    .select('id')
    .eq('user_id', learnerId)
    .eq('program_id', programId)
    .maybeSingle();

  if (existing) return { ok: true, certificateId: existing.id };

  await setAuditContext(db, { systemActor: 'credential_pipeline' });

  const { data: cert, error } = await db
    .from('certificates')
    .insert({
      user_id: learnerId,
      program_id: programId,
      enrollment_id: enrollmentId,
      course_name: courseName,
      program_name: programName,
      hours_completed: hoursCompleted,
      issued_by: issuedBy,
      issued_date: new Date().toISOString().split('T')[0],
      status: 'active',
    })
    .select('id')
    .single();

  if (error || !cert) return { ok: false, error: 'Failed to issue certificate' };
  return { ok: true, certificateId: cert.id };
}

// =============================================================================
// checkCertificateIssuanceEligibility
//
// Gate that must pass before any certificate is inserted.
// Checks two independent conditions:
//
//   1. Payment guard — if the primary credential requires self_pay, there must
//      be a 'paid' exam_funding_authorization for this learner + credential.
//      Prevents issuing certificates to learners who never paid the exam fee.
//
//   2. Exam passage guard — if the program has a primary credential, there must
//      be a passed credential_attempt for this learner + credential.
//      Prevents issuing certificates before the exam is actually passed.
//
// Returns { eligible: true } or { eligible: false, reason: string }.
// Callers must return 400 with the reason if not eligible.
//
// Non-exam programs (non_exam_program = true on programs table) skip guard 2.
// Programs with no program_credentials rows pass both guards (legacy programs).
// =============================================================================

export async function checkCertificateIssuanceEligibility(
  learnerId: string,
  programId: string
): Promise<{ eligible: boolean; reason?: string }> {
  const db = createAdminClient();
  if (!db) return { eligible: false, reason: 'Database unavailable' };

  // Load primary credential for this program (if any)
  const { data: pc } = await db
    .from('program_credentials')
    .select('credential_id, is_primary, exam_fee_payer, exam_fee_cents')
    .eq('program_id', programId)
    .eq('is_primary', true)
    .maybeSingle();

  // No program_credentials row → legacy program, no gate
  if (!pc) return { eligible: true };

  // Check whether this is a non-exam program (attendance/hours only)
  const { data: prog } = await db
    .from('programs')
    .select('non_exam_program')
    .eq('id', programId)
    .maybeSingle();

  const isNonExam = prog?.non_exam_program === true;

  // Guard 1: payment check for self_pay credentials with a non-zero fee
  if (pc.exam_fee_payer === 'self_pay' && (pc.exam_fee_cents ?? 0) > 0) {
    const { data: auth } = await db
      .from('exam_funding_authorizations')
      .select('id, funding_status')
      .eq('learner_id', learnerId)
      .eq('credential_id', pc.credential_id)
      .eq('funding_status', 'paid')
      .maybeSingle();

    if (!auth) {
      return {
        eligible: false,
        reason: 'Exam fee has not been paid. Complete checkout before requesting a certificate.',
      };
    }
  }

  // Guard 2: exam passage check (skip for non-exam programs)
  if (!isNonExam) {
    const { data: attempt } = await db
      .from('credential_attempts')
      .select('id, passed, attempt_status')
      .eq('learner_id', learnerId)
      .eq('credential_id', pc.credential_id)
      .eq('passed', true)
      .maybeSingle();

    if (!attempt) {
      return {
        eligible: false,
        reason: 'Primary credential exam has not been passed. Pass the exam before requesting a certificate.',
      };
    }
  }

  return { eligible: true };
}
