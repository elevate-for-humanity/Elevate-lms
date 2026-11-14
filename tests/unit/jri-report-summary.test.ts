import { expect, it } from 'vitest';
import { summarizeJriReport, type JriReportRow } from '@/lib/learner/jri-report-summary';
const row = (id: string, learner = 'learner'): JriReportRow => ({ enrollment_id: id, participant_id: learner, full_name: 'Learner', email: null, program_title: 'Training', enrollment_status: 'active', enrolled_at: null, placement_status: null });
it('counts canonical enrollments and verified people without duplicating a learner across programs', () => {
  const first = { ...row('a'), enrollment_status: 'completed', placement_status: 'verified' };
  const summary = summarizeJriReport([first, first, { ...row('b'), placement_status: 'verified' }, { ...row('c', 'other'), placement_status: 'pending' }]);
  expect(summary).toMatchObject({ total: 3, learners: 2, completed: 1, active: 2, employed: 1, completionRate: 33, placementRate: 50 });
});
it('does not treat missing or unverified placement evidence as verified employment', () => {
  expect(summarizeJriReport([{ ...row('a'), placement_status: 'reported' }]).employed).toBe(0);
  expect(summarizeJriReport([])).toMatchObject({ total: 0, completionRate: 0, placementRate: 0 });
});
