import { expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { loadEmployerHiringReport } from '@/lib/employer/report-data';

type Row = Record<string, unknown>;
type Result = { data: Row[] | null; count: number | null; error: unknown };
type Query = {
  select: (columns: string, options?: { head?: boolean }) => Query;
  eq: (key: string, value: unknown) => Query;
  neq: (key: string, value: unknown) => Query;
  order: () => Query;
  limit: (value: number) => Query;
  then: (resolve: (value: Result) => unknown) => Promise<unknown>;
};
function fixture(failingTable = '', missingCount = false) {
  const tables: Record<string, Row[]> = {
    job_postings: [
      { id: 'a', employer_id: 'employer-a', status: 'active' },
      { id: 'b', employer_id: 'employer-b', status: 'active' },
    ],
    job_applications: [
      { id: 'app-a', job_posting_id: 'a', status: 'pending' },
      { id: 'hire-a', job_posting_id: 'a', status: 'hired' },
      { id: 'hire-b', job_posting_id: 'b', status: 'hired' },
    ],
    job_placements: [
      ...Array.from({ length: 102 }, () => ({
        employer_id: 'employer-a',
        status: 'placed',
        start_date: '2026-11-10',
        created_at: '2026-11-01',
      })),
      {
        employer_id: 'employer-b',
        status: 'placed',
        start_date: '2026-11-30',
        created_at: '2026-11-01',
      },
    ],
    candidate_employer_referrals: [
      { employer_id: 'employer-a', status: 'routed' },
      { employer_id: 'employer-a', status: 'revoked' },
      { employer_id: 'employer-b', status: 'routed' },
    ],
  };
  const from = vi.fn((table: string) => {
    const filters: Array<(row: Row) => boolean> = [];
    let head = false,
      limit = Infinity;
    const value = (row: Row, key: string) =>
      key === 'posting.employer_id'
        ? tables.job_postings.find((posting) => posting.id === row.job_posting_id)?.employer_id
        : row[key];
    const query: Query = {
      select: (_columns, options) => {
        head = Boolean(options?.head);
        return query;
      },
      eq: (key, expected) => {
        filters.push((row) => value(row, key) === expected);
        return query;
      },
      neq: (key, expected) => {
        filters.push((row) => value(row, key) !== expected);
        return query;
      },
      order: () => query,
      limit: (size) => {
        limit = size;
        return query;
      },
      then: (resolve) => {
        if (table === failingTable)
          return Promise.resolve({
            data: null,
            count: null,
            error: { message: 'unavailable' },
          }).then(resolve);
        const rows = (tables[table] ?? []).filter((row) => filters.every((filter) => filter(row)));
        return Promise.resolve({
          data: head ? null : rows.slice(0, limit),
          count: missingCount ? null : rows.length,
          error: null,
        }).then(resolve);
      },
    };
    return query;
  });
  return { db: { from } as unknown as SupabaseClient, from };
}

it('counts only the canonical employer jobs and keeps exact totals beyond the date sample', async () => {
  const { db, from } = fixture();
  const report = await loadEmployerHiringReport(db, 'employer-a');
  expect(report).toMatchObject({
    activePostings: 1,
    totalApplications: 2,
    newApps: 1,
    underReview: 0,
    hires: 1,
    rejected: 0,
    referrals: 1,
    placementCount: 102,
    avgDaysToHire: 9,
  });
  expect(report.placements).toHaveLength(100);
  expect(from.mock.calls.map(([table]) => table)).not.toContain('applications');
  expect(from.mock.calls.map(([table]) => table)).not.toContain('jobs');
});
it('does not query an unlinked employer or fall back to a user identity', async () => {
  const { db, from } = fixture();
  await expect(loadEmployerHiringReport(db, '')).rejects.toThrow('employer record');
  expect(from).not.toHaveBeenCalled();
});
it('reports failed database reads instead of replacing them with empty metrics', async () => {
  await expect(
    loadEmployerHiringReport(fixture('job_applications').db, 'employer-a'),
  ).rejects.toThrow('could not be loaded');
});
it('requires actual exact-count evidence even when a response has no database error', async () => {
  await expect(loadEmployerHiringReport(fixture('', true).db, 'employer-a')).rejects.toThrow(
    'could not be loaded',
  );
});
