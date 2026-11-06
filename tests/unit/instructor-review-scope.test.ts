import { describe, it, expect, vi } from 'vitest';
import { loadInstructorPendingReviews } from '@/lib/instructor/pending-reviews';
function database(error: unknown = null) {
  const queries: Array<{ table: string; filters: unknown[] }> = [];
  const from = vi.fn((table: string) => {
    const entry = { table, filters: [] as unknown[] }; queries.push(entry);
    const q: any = { select: () => q, eq: (key: string, value: unknown) => { entry.filters.push([key, value]); return q; },
      in: (key: string, value: unknown) => { entry.filters.push([key, value]); return q; }, order: () => q,
      limit: async () => ({ data: error ? null : [], error }) };
    return q;
  });
  return { db: { from }, queries };
}
describe('authorized instructor review scope', () => {
  it('does not read privileged tables without assignments', async () => {
    const { db } = database();
    await loadInstructorPendingReviews(db, { isAdmin: false, studentIds: [] });
    expect(db.from).not.toHaveBeenCalled();
  });
  it('restricts both review sources to assigned students', async () => {
    const { db, queries } = database();
    await loadInstructorPendingReviews(db, { isAdmin: false, studentIds: ['assigned', 'assigned'] });
    expect(queries).toEqual([
      { table: 'competency_log', filters: [['supervisor_verified', false], ['apprentice_id', ['assigned']]] },
      { table: 'barber_instructor_signoffs', filters: [['status', 'pending'], ['user_id', ['assigned']]] },
    ]);
  });
  it('allows platform oversight but retains pending filters and errors', async () => {
    const failure = { message: 'database unavailable' };
    const { db, queries } = database(failure);
    const result = await loadInstructorPendingReviews(db, { isAdmin: true, studentIds: [] });
    expect(queries.map(q => q.filters)).toEqual([[['supervisor_verified', false]], [['status', 'pending']]]);
    expect(result.pendingOjtResult.error).toBe(failure);
    expect(result.pendingSignoffsResult.error).toBe(failure);
  });
});
