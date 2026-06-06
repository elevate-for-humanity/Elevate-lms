/**
 * Public marketing copy for program length — one range sitewide unless a page shows a specific program's durationWeeks.
 */
export const PUBLIC_PROGRAM_DURATION_RANGE = '4–16 weeks';

export function formatProgramDurationWeeks(weeks: number): string {
  const n = Math.max(1, Math.round(weeks));
  return `${n} ${n === 1 ? 'week' : 'weeks'}`;
}
