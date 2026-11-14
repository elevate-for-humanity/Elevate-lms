import { expect, it } from 'vitest';
import {
  loadStudentDirectory,
  directoryEnrollmentState,
} from '@/lib/admin/student-directory-enrollments';
import type { SupabaseClient } from '@supabase/supabase-js';
it('loads every learner page and batches both primary and legacy enrollment identities', async () => {
  const profiles = Array.from({ length: 1003 }, (_, i) => ({
    id: `learner-${i}`,
    role: i % 2 ? 'apprentice' : 'student',
  }));
  const rows = {
    profiles,
    program_enrollments: [
      {
        id: 'primary',
        user_id: 'learner-1002',
        student_id: 'learner-1',
        enrolled_at: '2026-10-31',
      },
      { id: 'legacy', user_id: null, student_id: 'learner-1', enrolled_at: '2026-10-30' },
    ],
  };
  const roles: string[][] = [];
  const db = {
    from(table: keyof typeof rows) {
      let predicates: ((row: Record<string, unknown>) => boolean)[] = [];
      let start = 0,
        end = Infinity;
      const q = {
        select: () => q,
        in: (key: string, values: string[]) => {
          if (key === 'role') roles.push(values);
          predicates.push((row) => values.includes(row[key] as string));
          return q;
        },
        like: () => q,
        order: () => q,
        is: (key: string, value: unknown) => {
          predicates.push((row) => row[key] === value);
          return q;
        },
        range: (a: number, b: number) => {
          start = a;
          end = b;
          return q;
        },
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve({
            data: rows[table]
              .filter((row) => predicates.every((f) => f(row)))
              .slice(start, end + 1),
            error: null,
          }).then(resolve),
      };
      return q;
    },
  };
  const result = await loadStudentDirectory(db as unknown as SupabaseClient);
  expect(result.profiles).toHaveLength(1003);
  expect(roles[0]).toContain('barber_apprentice');
  expect(result.enrollments.map((row) => row.id)).toEqual(['primary', 'legacy']);
});
it('never labels stale active enrollment rows as active after revocation', () => {
  expect(
    directoryEnrollmentState({
      status: 'active',
      enrollment_state: 'active',
      revoked_at: '2026-01-01',
    }),
  ).toBe('revoked');
  expect(directoryEnrollmentState({ status: 'suspended', enrollment_state: 'active' })).toBe(
    'suspended',
  );
});
