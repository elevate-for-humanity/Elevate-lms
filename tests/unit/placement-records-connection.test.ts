import { expect, it } from 'vitest';
import { loadRecordedPlacements } from '@/lib/analytics/placement-records';
function fixture(fail = '') {
  const filters: unknown[][] = [];
  const rows: Record<string, any[]> = {
    placement_records: [{ id: 'placement', learner_id: 'learner', program_id: 'program', employer_id: 'employer', job_title: 'Technician', annual_salary: 48000, status: 'verified' }],
    profiles: [{ id: 'learner', full_name: 'Recorded Learner' }], programs: [{ id: 'program', title: 'HVAC' }], employers: [{ id: 'employer', company_name: 'Employer' }],
  };
  const db: any = { from: (table: string) => {
    const result = () => ({ data: rows[table] ?? [], error: table === fail ? { message: 'Unavailable' } : null });
    const q: any = { select: () => q, order: () => q, eq: (...args: unknown[]) => { filters.push([table, ...args]); return q; }, range: async () => result(), in: async () => result() }; return q;
  } };
  return { db, filters };
}
it('connects recorded outcomes to real learner, program and employer identities', async () => {
  const { db, filters } = fixture();
  expect(await loadRecordedPlacements(db, 'program')).toEqual([expect.objectContaining({ studentName: 'Recorded Learner', programName: 'HVAC', employerName: 'Employer', position: 'Technician', salary: 48000, status: 'verified' })]);
  expect(filters).toContainEqual(['placement_records', 'program_id', 'program']);
});
it('does not present unavailable placement or identity records as a clean empty pipeline', async () => {
  await expect(loadRecordedPlacements(fixture('placement_records').db)).rejects.toBeTruthy();
  await expect(loadRecordedPlacements(fixture('profiles').db)).rejects.toBeTruthy();
});
