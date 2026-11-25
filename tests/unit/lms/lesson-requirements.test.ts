import { describe, expect, it } from 'vitest';
import { checkRequiredLessonWork } from '@/lib/lms/lesson-requirements';

type Row = Record<string, unknown>;

/** Minimal thenable Supabase-chain fake: filters are pre-applied by each test's fixture rows. */
function makeDb(tables: Record<string, Row[] | Error>) {
  return {
    from(table: string) {
      const chain: Record<string, unknown> = {
        select: () => chain,
        eq: () => chain,
        in: () => chain,
        or: () => chain,
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        then: (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
          const rows = tables[table];
          if (rows instanceof Error)
            return Promise.resolve({ data: null, error: rows }).then(resolve, reject);
          return Promise.resolve({ data: rows ?? [], error: null }).then(resolve, reject);
        },
      };
      return chain;
    },
  } as never;
}

const input = { userId: 'user-1', lessonId: 'lesson-1', courseId: 'course-1' };

describe('checkRequiredLessonWork — no-skip gate', () => {
  it('a lesson with no required assignments completes normally', async () => {
    const db = makeDb({ assignments: [], assignment_submissions: [] });
    const result = await checkRequiredLessonWork(db, input);
    expect(result.allowed).toBe(true);
    expect(result.missing).toEqual([]);
    expect(result.failedOpen).toBe(false);
  });

  it('blocks completion while a required assignment is unsubmitted, naming it', async () => {
    const db = makeDb({
      assignments: [{ id: 'a1', title: 'Lab report' }],
      assignment_submissions: [],
    });
    const result = await checkRequiredLessonWork(db, input);
    expect(result.allowed).toBe(false);
    expect(result.missing).toEqual([{ id: 'a1', title: 'Lab report' }]);
  });

  it('allows completion once the learner has submitted', async () => {
    const db = makeDb({
      assignments: [{ id: 'a1', title: 'Lab report' }],
      assignment_submissions: [{ assignment_id: 'a1', submitted_at: '2026-11-24T00:00:00Z' }],
    });
    const result = await checkRequiredLessonWork(db, input);
    expect(result.allowed).toBe(true);
  });

  it('a submission row without submitted_at does not count', async () => {
    const db = makeDb({
      assignments: [{ id: 'a1', title: 'Lab report' }],
      assignment_submissions: [{ assignment_id: 'a1', submitted_at: null }],
    });
    const result = await checkRequiredLessonWork(db, input);
    expect(result.allowed).toBe(false);
  });

  it('FAILS OPEN when the required-work data cannot be read', async () => {
    const db = makeDb({ assignments: new Error('connection reset'), assignment_submissions: [] });
    const result = await checkRequiredLessonWork(db, input);
    expect(result.allowed).toBe(true);
    expect(result.failedOpen).toBe(true);
  });
});
