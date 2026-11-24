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

/** A request alone never grants authority over an unconfigured training program. */
export function unresolvedProgramHolderInterest(data: Record<string, unknown>): boolean {
  return Boolean(data.requested_program_interest) &&
    (!Array.isArray(data.requested_program_slugs) ||
      !data.requested_program_slugs.some((slug) => typeof slug === 'string' && slug.trim()));
}
