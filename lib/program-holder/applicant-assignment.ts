// Pure selection + mapping logic for assigning student applications to a
// Program Holder (CNA referrals to Achieve, and any holder/program after that).
//
// This module is intentionally pure: no Supabase, no Next.js, no I/O. The
// admin API route loads rows and calls these helpers, so the batch rule is
// unit-testable without a database.
//
// The rule, as Elizabeth stated it (2026-11-23):
// - Route the CNA applicants to Achieve Training Institute.
// - The batch is 50, earliest-submitted first.
// - Deduplicate by applicant (one application per person; the admin list
//   contains duplicates, e.g. the same name under two emails).
// - Never assign someone already assigned to any holder, and never assign
//   someone already enrolled.
// - Never pick at random: the order is created_at ascending (then id), and
//   every skipped applicant is reported with a reason so the preview can be
//   reviewed before anything is applied.

export type ApplicantRow = {
  id: string;
  user_id?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  program_id?: string | null;
  program_slug?: string | null;
  program_interest?: string | null;
  status?: string | null;
  revoked_at?: string | null;
  created_at?: string | null;
};

/** Application statuses that may still be referred to a holder. */
export const ASSIGNABLE_APPLICATION_STATUSES = [
  'submitted',
  'pending',
  'under_review',
  'in_review',
  'pending_admin_review',
  'applied',
] as const;

/** Holder statuses that may receive applicant assignments. */
export const ASSIGNABLE_HOLDER_STATUSES = ['active', 'approved', 'approved_pending_mou'] as const;

/**
 * A holder whose approval is recorded but whose MOU is still unsigned may
 * receive referrals. That is the Achieve case: status approved_pending_mou
 * means approved — only the signature is outstanding — and the old routing
 * trigger excluded exactly that status, which is why nothing ever routed.
 */
export function isAssignableHolderStatus(status: string | null | undefined): boolean {
  return (ASSIGNABLE_HOLDER_STATUSES as readonly string[]).includes(
    String(status ?? '').toLowerCase(),
  );
}

function storedApplicantName(app: ApplicantRow): string {
  const full = [app.full_name, app.name].find((value) => value && value.trim());
  if (full) return full.trim();
  return [app.first_name, app.last_name].filter(Boolean).join(' ').trim();
}

export function applicantDisplayName(app: ApplicantRow): string {
  return storedApplicantName(app) || 'Applicant';
}

function normalizeEmail(email: string | null | undefined): string {
  return String(email ?? '').trim().toLowerCase();
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Identity keys for one person. A row carries every identifier it has: the
 * platform user id, the email, and the normalized name (+ phone when
 * present). Two rows are the same person when ANY key matches — the admin
 * list contains the same applicant twice under different emails, so a
 * single email key would miss those. Name-only collisions between two
 * different people are possible but rare in a small batch, and duplicates
 * are reported in the preview (not silently dropped), so an admin can
 * review them and assign anyone wrongly skipped by id.
 */
export function applicantIdentityKeys(app: ApplicantRow): string[] {
  const keys: string[] = [];
  const email = normalizeEmail(app.email);
  const userId = String(app.user_id ?? '').trim();
  const name = normalizeName(storedApplicantName(app));
  const phone = String(app.phone ?? '').replace(/[^0-9]/g, '');
  if (userId) keys.push(`user:${userId}`);
  if (email) keys.push(`email:${email}`);
  if (name && phone) keys.push(`name-phone:${name}:${phone}`);
  else if (name) keys.push(`name:${name}`);
  if (!keys.length) keys.push(`application:${app.id}`);
  return keys;
}

export type BatchSelection = {
  selected: ApplicantRow[];
  skipped: {
    wrongStatus: ApplicantRow[];
    revoked: ApplicantRow[];
    alreadyAssigned: ApplicantRow[];
    alreadyEnrolled: ApplicantRow[];
    duplicate: ApplicantRow[];
    /** Eligible, but past the batch limit. Reported so the preview is complete. */
    beyondLimit: ApplicantRow[];
  };
};

/**
 * Select the referral batch from candidate applications.
 *
 * Order is earliest-submitted first (created_at ascending, id ascending as
 * the tiebreak) — never random. `alreadyAssignedApplicationIds` covers
 * applications already projected to any holder; `alreadyAssignedKeys` covers
 * the same person under a different application id. `enrolledUserIds` covers
 * applicants who already hold an enrollment for the program.
 */
export function selectReferralBatch(
  candidates: ApplicantRow[],
  options: {
    limit: number;
    alreadyAssignedApplicationIds?: Set<string>;
    alreadyAssignedKeys?: Set<string>;
    enrolledUserIds?: Set<string>;
  },
): BatchSelection {
  const assignedIds = options.alreadyAssignedApplicationIds ?? new Set<string>();
  const assignedKeys = options.alreadyAssignedKeys ?? new Set<string>();
  const enrolledIds = options.enrolledUserIds ?? new Set<string>();
  const limit = Math.max(0, Math.floor(options.limit));

  const skipped: BatchSelection['skipped'] = {
    wrongStatus: [],
    revoked: [],
    alreadyAssigned: [],
    alreadyEnrolled: [],
    duplicate: [],
    beyondLimit: [],
  };
  const selected: ApplicantRow[] = [];
  const seenKeys = new Set<string>();

  const ordered = [...candidates].sort((a, b) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : Number.NaN;
    const bTime = b.created_at ? Date.parse(b.created_at) : Number.NaN;
    if (!Number.isNaN(aTime) && !Number.isNaN(bTime) && aTime !== bTime) return aTime - bTime;
    return String(a.id).localeCompare(String(b.id));
  });

  // Every candidate is classified, even after the batch fills, so the
  // preview's skip counts are complete and reviewable.
  for (const app of ordered) {
    if (app.revoked_at) {
      skipped.revoked.push(app);
      continue;
    }
    if (!ASSIGNABLE_APPLICATION_STATUSES.includes(
      String(app.status ?? '').toLowerCase() as (typeof ASSIGNABLE_APPLICATION_STATUSES)[number],
    )) {
      skipped.wrongStatus.push(app);
      continue;
    }
    if (assignedIds.has(app.id)) {
      skipped.alreadyAssigned.push(app);
      continue;
    }
    const keys = applicantIdentityKeys(app);
    if (keys.some((key) => assignedKeys.has(key) || seenKeys.has(key))) {
      skipped.duplicate.push(app);
      continue;
    }
    if (app.user_id && enrolledIds.has(String(app.user_id))) {
      skipped.alreadyEnrolled.push(app);
      continue;
    }
    if (selected.length >= limit) {
      skipped.beyondLimit.push(app);
      continue;
    }
    for (const key of keys) seenKeys.add(key);
    selected.push(app);
  }

  return { selected, skipped };
}

/** Row written to program_holder_students for one assigned applicant. */
export function buildHolderStudentRow(
  holderId: string,
  programId: string,
  app: ApplicantRow,
): Record<string, unknown> {
  return {
    program_holder_id: holderId,
    application_id: app.id,
    student_id: app.user_id ?? null,
    user_id: app.user_id ?? null,
    program_id: programId,
    applicant_name: storedApplicantName(app) || null,
    applicant_email: normalizeEmail(app.email) || null,
    applicant_phone: app.phone ?? null,
    status: 'applied',
    application_status: app.status ?? 'applied',
    label: 'Elevate-assigned referral',
    created_at: app.created_at ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
