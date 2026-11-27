import { resolveProgram } from '@/lib/program-registry';

/**
 * Program-holder requests awaiting scope review are not published learner programs.
 * In particular, the janitorial request must not silently select the separate
 * commercial-cleaning course or building-maintenance classroom program.
 */
export const PROGRAM_HOLDER_INTERESTS = [
  {
    id: 'janitorial',
    selection: 'interest:janitorial',
    label: 'Janitorial / Building Services Technician — program scope review',
  },
] as const;

export function programHolderInterest(value: unknown) {
  return PROGRAM_HOLDER_INTERESTS.find((interest) => interest.id === value);
}

export function programHolderInterestFromSelection(value: string) {
  return PROGRAM_HOLDER_INTERESTS.find((interest) => interest.selection === value);
}

export type ProgramHolderScopeReview = {
  requested_interest: string;
  program_id: string;
  program_slug: string;
  program_title: string;
  reviewed_by: string;
  reviewed_at: string;
  note: string;
};

export const PROGRAM_HOLDER_SCOPE_INTAKE_FIELDS = 'id,application_type,destination_table,destination_id,status,payload';

/** Only a protected intake bound by the server to this application can attest review. */
export function programHolderApplicationScope(
  applicationId: string,
  applicationData: Record<string, unknown>,
  intake: Record<string, unknown> | null,
): Record<string, unknown> {
  if (!intake) return { ...applicationData, program_scope_review: undefined };
  if (!intake.id || intake.application_type !== 'program_holder' ||
      intake.destination_table !== 'program_holder_applications' ||
      intake.destination_id !== applicationId || intake.status !== 'processed' ||
      !intake.payload || typeof intake.payload !== 'object' || Array.isArray(intake.payload)) {
    throw new Error('Program Holder intake authority could not be verified.');
  }
  const payload = intake.payload as Record<string, unknown>;
  return {
    ...applicationData,
    requested_program_interest: payload.requested_program_interest,
    requested_program_slugs: payload.requested_program_slugs,
    program_scope_review: payload.program_scope_review,
  };
}

/** Canonical scope choices include active catalog rows and programs made live by publishing. */
export function isActiveProgramHolderScopeProgram(program: {
  id?: unknown; slug?: unknown; is_active?: unknown; status?: unknown;
}): boolean {
  return typeof program.id === 'string' && Boolean(program.id) &&
    typeof program.slug === 'string' && resolveProgram(program.slug)?.active === true &&
    resolveProgram(program.slug)?.slug === program.slug &&
    program.is_active === true && (program.status === 'active' || program.status === 'published');
}

/** Original applicant interest and requested slugs remain unchanged by staff review. */
export function programHolderScopeReview(data: Record<string, unknown>): ProgramHolderScopeReview | null {
  const review = data.program_scope_review;
  if (!review || typeof review !== 'object' || Array.isArray(review)) return null;
  const fields = review as Record<string, unknown>;
  if (!programHolderInterest(data.requested_program_interest) ||
      fields.requested_interest !== data.requested_program_interest ||
      !['program_id', 'program_slug', 'program_title', 'reviewed_by', 'reviewed_at', 'note']
        .every((field) => typeof fields[field] === 'string' && String(fields[field]).trim()) ||
      resolveProgram(String(fields.program_slug))?.active !== true ||
      resolveProgram(String(fields.program_slug))?.slug !== fields.program_slug ||
      !Number.isFinite(Date.parse(String(fields.reviewed_at)))) return null;
  return fields as ProgramHolderScopeReview;
}

export function programHolderProgramSlugs(data: Record<string, unknown>): string[] {
  if (data.requested_program_interest) {
    const review = programHolderScopeReview(data);
    return review ? [review.program_slug] : [];
  }
  return Array.isArray(data.requested_program_slugs)
    ? [...new Set(data.requested_program_slugs.map((value) => String(value || '').trim()).filter(Boolean))]
    : [];
}

/** A request alone never grants authority over an unconfigured training program. */
export function unresolvedProgramHolderInterest(data: Record<string, unknown>): boolean {
  return Boolean(data.requested_program_interest) && !programHolderScopeReview(data);
}
