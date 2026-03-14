/**
 * Exam eligibility service.
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

import { createAdminClient } from '@/lib/supabase/admin';
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
  const db = createAdminClient();
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

    // EPA 608: delegate to existing simulation-based function
    if (cr?.abbreviation === 'EPA-608' || cr?.verification_source === 'epa_direct') {
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
  const summaryRow = rows.find(r => r.domain_key === '__summary__');
  const domainRows = rows.filter(r => r.domain_key !== '__summary__');

  const domains: DomainEligibility[] = domainRows.map(r => ({
    domainKey:        r.domain_key,
    domainName:       r.domain_name,
    weightPercent:    r.weight_percent ?? 0,
    lessonsRequired:  r.lessons_required ?? 0,
    lessonsCompleted: r.lessons_completed ?? 0,
    isCovered:        r.is_domain_covered ?? false,
    blockingReason:   r.blocking_reason ?? null,
  }));

  const isEligible = summaryRow?.is_domain_covered ?? false;
  const blockingReason = summaryRow?.blocking_reason ?? null;

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

  const db = createAdminClient();
  if (!db) return { ...result, authorizationCreated: false };

  // Resolve default funding source from program_credentials
  const { data: pc } = await db
    .from('program_credentials')
    .select('exam_fee_payer, exam_fee_cents')
    .eq('program_id', programId)
    .eq('credential_id', credentialId)
    .maybeSingle();

  const fundingSource = pc?.exam_fee_payer ?? 'self_pay';
  const amountCents   = pc?.exam_fee_cents ?? 0;

  // Upsert — idempotent, won't overwrite an existing approved/paid authorization
  const { data: existing } = await db
    .from('exam_funding_authorizations')
    .select('id, funding_status')
    .eq('learner_id', learnerId)
    .eq('credential_id', credentialId)
    .is('credential_attempt_id', null)
    .maybeSingle();

  if (existing) {
    // Already exists — don't overwrite
    return { ...result, authorizationCreated: false };
  }

  const { error } = await db
    .from('exam_funding_authorizations')
    .insert({
      learner_id:          learnerId,
      credential_id:       credentialId,
      program_id:          programId,
      funding_source:      fundingSource,
      funding_status:      fundingSource === 'self_pay' ? 'unresolved' : 'pending',
      funded_amount_cents: amountCents > 0 ? amountCents : null,
    });

  if (error) {
    logger.error('Failed to create exam_funding_authorization', { learnerId, credentialId, error });
    return { ...result, authorizationCreated: false };
  }

  logger.info('Exam funding authorization created', {
    learnerId, credentialId, programId, fundingSource,
  });

  return { ...result, authorizationCreated: true };
}
