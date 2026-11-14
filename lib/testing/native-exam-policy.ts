/** Official EPA delivery uses a protected server-side bank, never practice questions. */
export const EPA_SECTIONS = ['core', 'type_i', 'type_ii', 'type_iii'] as const;
export type EpaSection = (typeof EPA_SECTIONS)[number];
export type EpaExamType = Exclude<EpaSection, 'core'> | 'universal';
export function requiredSections(type: string): readonly EpaSection[] {
  if (type === 'universal') return EPA_SECTIONS;
  if (type === 'type_i' || type === 'type_ii' || type === 'type_iii') return ['core', type];
  throw new Error('Choose Type I, Type II, Type III, or Universal');
}
export function csvCell(value: unknown): string {
  const raw = String(value ?? '');
  const safe = /^[\s]*[=+@-]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}
export function reportingPeriod(year: number, half: number) {
  if (!Number.isInteger(year) || year < 2000 || year > 2200 || ![1, 2].includes(half)) {
    throw new Error('A valid year and half (1 or 2) are required');
  }
  return {
    start: `${year}-${half === 1 ? '01' : '07'}-01T00:00:00.000Z`,
    end: `${half === 1 ? year : year + 1}-${half === 1 ? '07' : '01'}-01T00:00:00.000Z`,
  };
}
