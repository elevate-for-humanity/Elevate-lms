/**
 * Exam eligibility service.
 *
 * AUTHORIZATION AUTHORITY MODEL
 * ─────────────────────────────
 * Path A — DB trigger (authoritative):
 *   trg_auto_exam_authorization fires on checkpoint_scores INSERT.
 *   When evaluate_exam_readiness() returns is_ready=true, it writes a row to
 *   exam_authorizations. This is the source of truth for whether a learner
 *   may sit an exam. It is deterministic, independent of app-layer bugs, and
 *   idempotent (unique index on user_id + program_id where status != expired/revoked).
 *
 * Path B — service layer (funding/auxiliary):
 *   checkEligibilityAndAuthorize() is called from the lesson completion route.
 *   It writes to exam_funding_authorizations — a separate table used for
 *   funding coordination and DOL reporting. It is NOT the gate for exam access.
 *   If Path B fails silently, Path A still governs.
 *
 * The exam-readiness API (/api/lms/courses/[courseId]/exam-readiness) reads
 * exam_authorizations (Path A) to surface authorization status to the learner.
 *
 * Wraps evaluate_exam_eligibility_v2() (credential_exam_domains aware) and
 * evaluate_exam_eligibility() (EPA simulation pipeline, preserved as-is).
 *
 * Call checkExamEligibility() from:
 *   - LMS course completion handler (to auto-create exam_funding_authorization)
 *   - /lms/certification page (to show eligibility status)
 *   - /api/credentials/funding-decision (to gate checkout)
 *
 * Never call the SQL function directly from API routes — use this service
 * so eligibility logic stays in one place.
 */

import { createAdminClient, getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DomainEligibility {
  domainKey: string;
  domainName: string;
  weightPercent: number;
  lessonsRequired: number;
  lessonsCompleted: number;
  isCovered: boolean;
  blockingReason: string | null;
}

export interface EligibilityResult {
  learnerId: string;
  credentialId: string;
  programId: string;
  /** True only when ALL domains are covered and ALL required completion rules pass */
  isEligible: boolean;
  /** Human-readable summary of what is blocking eligibility, or null if eligible */
  blockingReason: string | null;
  /** Per-domain breakdown */
  domains: DomainEligibility[];
  evaluatedAt: string;
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Evaluates whether a learner is eligible to sit for a credential exam.
 *
 * Uses evaluate_exam_eligibility_v2() for all credentials except EPA 608,
 * which uses the existing evaluate_exam_eligibility() simulation pipeline.
 *
 * Returns a structured result. Never throws — errors are returned as
 * isEligible: false with a blockingReason describing the failure.
 */
export async function checkExamEligibility(
  learnerId: string,
  credentialId: string,
  programId: string
): Promise<EligibilityResult> {
  const db = await getAdminClient();
  const evaluatedAt = new Date().toISOString();

  if (!db) {
    return ineligible(learnerId, credentialId, programId, evaluatedAt,
      'Database unavailable', []);
  }

  try {
    // Determine which function to call based on credential
    const { data: cr } = await db
      .from('credential_registry')
      .select('abbreviation, requires_exam, verification_source')
      .eq('id', credentialId)
      .maybeSingle();

    // EPA 608 simulation pipeline: only active when verification_source = 'epa_direct'.
    // Credentials with abbreviation 'EPA-608' but verification_source = 'external_link'
    // use the standard v2 domain-coverage path — the simulation pipeline is not wired.
    if (cr?.verification_source === 'epa_direct') {
      return await checkEpaEligibility(db, learnerId, credentialId, programId, evaluatedAt);
    }

    // All other credentials: use v2 function
    const { data: rows, error } = await db
      .rpc('evaluate_exam_eligibility_v2', {
        p_learner_id:    learnerId,
        p_credential_id: credentialId,
        p_program_id:    programId,
      });

    if (error) {
      logger.error('evaluate_exam_eligibility_v2 failed', { learnerId, credentialId, error });
      return ineligible(learnerId, credentialId, programId, evaluatedAt,
        'Eligibility check failed — contact support', []);
    }

    return parseV2Result(learnerId, credentialId, programId, evaluatedAt, rows ?? []);

  } catch (err) {
    logger.error('checkExamEligibility unexpected error', { learnerId, credentialId, err });
    return ineligible(learnerId, credentialId, programId, evaluatedAt,
      'Eligibility check failed — contact support', []);
  }
}

// ─── EPA delegation ───────────────────────────────────────────────────────────

async function checkEpaEligibility(
  db: ReturnType<typeof createAdminClient>,
  learnerId: string,
  credentialId: string,
  programId: string,
  evaluatedAt: string
): Promise<EligibilityResult> {
  const { data: rows, error } = await db!
    .rpc('evaluate_exam_eligibility', {
      p_learner_id:    learnerId,
      p_credential_id: credentialId,
    });

  if (error) {
    logger.error('evaluate_exam_eligibility (EPA) failed', { learnerId, credentialId, error });
    return ineligible(learnerId, credentialId, programId, evaluatedAt,
      'EPA eligibility check failed — contact support', []);
  }

  const domains: DomainEligibility[] = (rows ?? []).map((r: any) => ({
    domainKey:        r.domain_key,
    domainName:       r.domain_key,   // EPA function doesn't return domain_name
    weightPercent:    25,             // EPA 608: 4 domains × 25% each
    lessonsRequired:  r.sims_required ?? 0,
    lessonsCompleted: r.sims_passed   ?? 0,
    isCovered:        r.is_eligible   ?? false,
    blockingReason:   r.is_eligible ? null : `${r.sims_passed}/${r.sims_required} simulations passed`,
  }));

  const isEligible = domains.length > 0 && domains.every(d => d.isCovered);
  const blocking = isEligible ? null
    : domains.filter(d => !d.isCovered).map(d => d.blockingReason).filter(Boolean).join('; ');

  return {
    learnerId, credentialId, programId, evaluatedAt,
    isEligible,
    blockingReason: blocking || null,
    domains,
  };
}

// ─── V2 result parser ─────────────────────────────────────────────────────────

function parseV2Result(
  learnerId: string,
  credentialId: string,
  programId: string,
  evaluatedAt: string,
  rows: any[]
): EligibilityResult {
  const summaryRow = rows.find(r => r.out_domain_key === '__summary__');
  const domainRows = rows.filter(r => r.out_domain_key !== '__summary__');

  const domains: DomainEligibility[] = domainRows.map(r => ({
    domainKey:        r.out_domain_key,
    domainName:       r.out_domain_name,
    weightPercent:    r.out_weight_percent ?? 0,
    lessonsRequired:  r.out_lessons_required ?? 0,
    lessonsCompleted: r.out_lessons_completed ?? 0,
    isCovered:        r.out_is_domain_covered ?? false,
    blockingReason:   r.out_blocking_reason ?? null,
  }));

  const isEligible = summaryRow?.out_is_domain_covered ?? false;
  const blockingReason = summaryRow?.out_blocking_reason ?? null;

  return { learnerId, credentialId, programId, evaluatedAt, isEligible, blockingReason, domains };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ineligible(
  learnerId: string,
  credentialId: string,
  programId: string,
  evaluatedAt: string,
  reason: string,
  domains: DomainEligibility[]
): EligibilityResult {
  return { learnerId, credentialId, programId, evaluatedAt,
           isEligible: false, blockingReason: reason, domains };
}

// ─── Convenience: check + auto-create funding authorization ──────────────────

/**
 * Checks eligibility and, if eligible, creates an exam_funding_authorization
 * if one doesn't already exist. Called from the LMS completion handler.
 *
 * Funding source is resolved from enrollment_funding_records — the canonical
 * per-learner funding authority. program_credentials is NOT consulted for
 * payer resolution; it only holds the exam fee amount as a program default.
 *
 * Returns the eligibility result regardless of whether authorization was created.
 */
export async function checkEligibilityAndAuthorize(
  learnerId: string,
  credentialId: string,
  programId: string
): Promise<EligibilityResult & { authorizationCreated: boolean }> {
  const result = await checkExamEligibility(learnerId, credentialId, programId);

  if (!result.isEligible) {
    return { ...result, authorizationCreated: false };
  }

  const db = await getAdminClient();
  if (!db) return { ...result, authorizationCreated: false };

  // Idempotency guard: skip if a non-denied authorization already exists.
  // Statuses 'unresolved', 'pending', 'approved', 'paid', 'waived' all mean
  // the authorization lifecycle is already in progress.
  const { data: existing } = await db
    .from('exam_funding_authorizations')
    .select('id, funding_status')
    .eq('learner_id', learnerId)
    .eq('credential_id', credentialId)
    .neq('funding_status', 'denied')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    return { ...result, authorizationCreated: false };
  }

  // Resolve funding source from the learner's enrollment funding record.
  // This is the single authority for who pays — not the credential, not the program.
  const { data: efr } = await db
    .from('enrollment_funding_records')
    .select('funding_source, amount_cents, status')
    .eq('learner_id', learnerId)
    .eq('program_id', programId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fall back to self_pay if no funding record exists yet.
  // The authorization is still created so staff can update it later.
  const fundingSource = efr?.funding_source ?? 'self_pay';

  // Map enrollment_funding_records.funding_source to exam_funding_authorizations.funding_source.
  // enrollment_funding_records uses workforce-specific values (wioa_title_i, jri, etc.);
  // exam_funding_authorizations uses a simpler enum. Map non-self-pay sources to 'grant'
  // unless they map to a more specific value.
  const EFA_FUNDING_SOURCE_MAP: Record<string, string> = {
    self_pay:              'self_pay',
    employer_sponsored:    'employer',
    scholarship:           'scholarship',
    wioa_title_i:          'grant',
    wioa_title_ii:         'grant',
    workforce_ready_grant: 'grant',
    jri:                   'grant',
    job_ready_indy:        'grant',
    dol_apprenticeship:    'grant',
    pell_grant:            'grant',
    other:                 'grant',
  };
  const efaFundingSource = EFA_FUNDING_SOURCE_MAP[fundingSource] ?? 'grant';

  // Determine initial funding_status:
  // - self_pay: unresolved (learner must pay via Stripe)
  // - approved enrollment funding record: pending (staff will authorize)
  // - no record or pending record: unresolved
  const efrApproved = efr?.status === 'approved' || efr?.status === 'disbursed';
  const fundingStatus = efaFundingSource === 'self_pay'
    ? 'unresolved'
    : efrApproved ? 'pending' : 'unresolved';

  // Use exam fee from program_credentials as the amount default.
  // This is a program-level default, not a per-learner override.
  const { data: pc } = await db
    .from('program_credentials')
    .select('exam_fee_cents')
    .eq('program_id', programId)
    .eq('credential_id', credentialId)
    .maybeSingle();

  const amountCents = efr?.amount_cents ?? pc?.exam_fee_cents ?? null;

  const { error } = await db
    .from('exam_funding_authorizations')
    .insert({
      learner_id:          learnerId,
      credential_id:       credentialId,
      program_id:          programId,
      funding_source:      efaFundingSource,
      funding_status:      fundingStatus,
      funded_amount_cents: amountCents,
    });

  if (error) {
    logger.error('Failed to create exam_funding_authorization', { learnerId, credentialId, error });
    return { ...result, authorizationCreated: false };
  }

  logger.info('Exam funding authorization created', {
    learnerId, credentialId, programId,
    fundingSource: efaFundingSource,
    fundingStatus,
  });

  return { ...result, authorizationCreated: true };
}
