/** Program requirements belong to program_enrollments, never partner/course IDs. */
export function selectOnboardingEnrollment<T extends { source_table: string; status: string }>(
  enrollments: readonly T[],
): T | null {
  const programs = enrollments.filter((row) => row.source_table === 'program_enrollments');
  return programs.find((row) =>
    ['active', 'enrolled', 'in_progress', 'pending'].includes(row.status.toLowerCase()),
  ) ?? programs[0] ?? null;
}
