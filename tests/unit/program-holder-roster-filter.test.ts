import { expect, it } from 'vitest';
import { filterHolderStudents } from '@/lib/program-holder/roster-filter';
const rows = [
  { id: 'active', full_name: 'Active Learner', email: 'learner@example.test', status: 'active' },
  {
    id: 'graduate',
    full_name: 'Completed Learner',
    email: 'graduate@example.test',
    status: 'completed',
  },
  { id: 'legacy', full_name: 'Legacy Learner', status: 'active', enrollment_state: 'graduated' },
];
it('finds an assigned learner by case-insensitive name or email', () => {
  expect(filterHolderStudents(rows, ' LEARNER@EXAMPLE.TEST ').map((r) => r.id)).toEqual(['active']);
  expect(filterHolderStudents(rows, 'completed learner').map((r) => r.id)).toEqual(['graduate']);
});
it('filters active and completed states without creating or exposing additional rows', () => {
  expect(filterHolderStudents(rows, '', 'active').map((r) => r.id)).toEqual(['active']);
  expect(filterHolderStudents(rows, '', 'completed').map((r) => r.id)).toEqual([
    'graduate',
    'legacy',
  ]);
  expect(filterHolderStudents(rows, 'missing')).toEqual([]);
  expect(filterHolderStudents(rows)).toEqual(rows);
});
