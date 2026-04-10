/**
 * Exam scheduling router.
 *
 * Resolves the correct scheduling path for a credential based on its
 * credential_providers row. Returns a SchedulingRoute that the UI and
 * notification system use to direct the learner.
 *
 * Routing is provider-driven — no hard-coded credential name matching.
 * The provider_id FK on credential_registry is the single source of truth.
 *
 * Scheduling modes:
 *   'external_url'   — learner clicks through to provider's scheduling portal
 *   'elevate_onsite' — Elevate schedules the exam internally (EPA 608, DOT)
 *   'state_portal'   — state agency portal (Indiana PLA, BMV, SDOH)
 *   'manual'         — staff schedules manually, no URL available
 */

import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// ─── Types ────────────────────────────────────────────────────────────────────

export type SchedulingMode =
  | 'external_url'
  | 'elevate_onsite'
  | 'state_portal'
  | 'manual';

export interface SchedulingRoute {
  credentialId:      string;
  credentialName:    string;
  abbreviation:      string;
  providerName:      string;
  providerType:      string;
  mode:              SchedulingMode;
  /** URL to open for external_url / state_portal modes. Null for elevate_onsite / manual. */
  schedulingUrl:     string | null;
  /** Contact email for manual scheduling or follow-up */
  contactEmail:      string | null;
  /** Human-readable instruction for the learner */
  instruction:       string;
}

export interface ExamScheduleRequest {
  learnerId:    string;
  credentialId: string;
  programId:    string;
  preferredDate?: string;   // ISO date string
  notes?: string;
}

// ─── Provider type → mode mapping ────────────────────────────────────────────

// Elevate-proctored credentials always use elevate_onsite regardless of provider type
const ELEVATE_PROCTORED_ADAPTERS = new Set([
  'epa_direct',
  'dot_odapc',
  'elevate_internal',
  'act_workkeys',   // Elevate is an authorized ACT testing site
]);

function resolveMode(
  providerType: string,
  verificationAdapter: string | null,
  examSchedulingUrl: string | null
): SchedulingMode {
  if (verificationAdapter && ELEVATE_PROCTORED_ADAPTERS.has(verificationAdapter)) {
    return 'elevate_onsite';
  }
  if (providerType === 'state_agency') {
    return examSchedulingUrl ? 'state_portal' : 'manual';
  }
  if (examSchedulingUrl) {
    return 'external_url';
  }
  return 'manual';
}

function buildInstruction(
  mode: SchedulingMode,
  credentialName: string,
  providerName: string,
  schedulingUrl: string | null,
  contactEmail: string | null
): string {
  switch (mode) {
    case 'elevate_onsite':
      return `Your ${credentialName} exam is proctored at Elevate for Humanity. `
           + `Staff will contact you to schedule your exam date.`;
    case 'external_url':
      return `Schedule your ${credentialName} exam directly through ${providerName}. `
           + `Click the link below to access the scheduling portal.`;
    case 'state_portal':
      return `Schedule your ${credentialName} exam through the ${providerName} portal. `
           + `You will need your program completion documentation.`;
    case 'manual':
      return `Contact ${contactEmail ?? 'Elevate staff'} to schedule your ${credentialName} exam `
           + `through ${providerName}.`;
  }
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Resolves the scheduling route for a credential.
 * Returns null if the credential or its provider cannot be found.
 */
export async function resolveSchedulingRoute(
  credentialId: string
): Promise<SchedulingRoute | null> {
  const db = await getAdminClient();
  if (!db) return null;

  const { data, error } = await db
    .from('credential_registry')
    .select(`
      id,
      name,
      abbreviation,
      credential_providers (
        id,
        name,
        provider_type,
        exam_scheduling_url,
        verification_adapter,
        contact_email
      )
    `)
    .eq('id', credentialId)
    .maybeSingle();

  if (error || !data) {
    logger.error('resolveSchedulingRoute: credential not found', { credentialId, error });
    return null;
  }

  const provider = (data as any).credential_providers;

  if (!provider) {
    // No provider linked — fall back to manual
    return {
      credentialId,
      credentialName:  data.name,
      abbreviation:    data.abbreviation,
      providerName:    'Elevate for Humanity',
      providerType:    'elevate',
      mode:            'manual',
      schedulingUrl:   null,
      contactEmail:    'info@elevateforhumanity.org',
      instruction:     `Contact Elevate staff to schedule your ${data.name} exam.`,
    };
  }

  const mode = resolveMode(
    provider.provider_type,
    provider.verification_adapter,
    provider.exam_scheduling_url
  );

  return {
    credentialId,
    credentialName:  data.name,
    abbreviation:    data.abbreviation,
    providerName:    provider.name,
    providerType:    provider.provider_type,
    mode,
    schedulingUrl:   mode !== 'elevate_onsite' && mode !== 'manual'
                       ? provider.exam_scheduling_url
                       : null,
    contactEmail:    provider.contact_email,
    instruction:     buildInstruction(
                       mode, data.name, provider.name,
                       provider.exam_scheduling_url, provider.contact_email
                     ),
  };
}

/**
 * Creates an exam_schedule_request row and returns the scheduling route.
 * Idempotent — if a pending request already exists for this learner +
 * credential, returns the existing route without creating a duplicate.
 */
export async function requestExamScheduling(
  req: ExamScheduleRequest
): Promise<{ route: SchedulingRoute | null; requestId: string | null; alreadyPending: boolean }> {
  const db = await getAdminClient();
  if (!db) return { route: null, requestId: null, alreadyPending: false };

  // Check for existing pending request
  const { data: existing } = await db
    .from('exam_schedule_requests')
    .select('id')
    .eq('learner_id', req.learnerId)
    .eq('credential_id', req.credentialId)
    .in('status', ['pending', 'scheduled'])
    .maybeSingle();

  if (existing) {
    const route = await resolveSchedulingRoute(req.credentialId);
    return { route, requestId: existing.id, alreadyPending: true };
  }

  // Resolve provider_id for the new request
  const { data: cr } = await db
    .from('credential_registry')
    .select('provider_id')
    .eq('id', req.credentialId)
    .maybeSingle();

  const { data: newReq, error } = await db
    .from('exam_schedule_requests')
    .insert({
      learner_id:      req.learnerId,
      credential_id:   req.credentialId,
      program_id:      req.programId,
      provider_id:     cr?.provider_id ?? null,
      preferred_date:  req.preferredDate ?? null,
      notes:           req.notes ?? null,
      status:          'pending',
    })
    .select('id')
    .single();

  if (error || !newReq) {
    logger.error('requestExamScheduling: insert failed', { req, error });
    return { route: null, requestId: null, alreadyPending: false };
  }

  const route = await resolveSchedulingRoute(req.credentialId);
  return { route, requestId: newReq.id, alreadyPending: false };
}
