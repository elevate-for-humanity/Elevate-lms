import { describe, expect, it } from 'vitest';
import {
  loadApplicationStatusCounts,
  APPLICATION_AWAITING_REVIEW_STATUSES,
} from '@/lib/admin/application-filters';
import { excludeQaProfiles, isTestOrAuditProfile } from '@/lib/admin/operational-profile-query';
import type { SupabaseClient } from '@supabase/supabase-js';

function dbMock(fail = false) {
  const calls: { status: string | null; filters: string[]; options: unknown }[] = [];
  return {
    calls,
    db: {
      from() {
        const call = {
          status: null as string | null,
          filters: [] as string[],
          options: undefined as unknown,
        };
        calls.push(call);
        const query = {
          select(_fields: string, options: unknown) {
            call.options = options;
            return query;
          },
          eq(_field: string, status: string) {
            call.status = status;
            return query;
          },
          or(value: string) {
            call.filters.push(value);
            return query;
          },
          then(resolve: (value: unknown) => unknown) {
            return Promise.resolve({
              count: call.status === null ? 1501 : call.status === 'submitted' ? 1400 : 0,
              error: fail ? { message: 'offline' } : null,
            }).then(resolve);
          },
        };
        return query;
      },
    } as unknown as SupabaseClient,
  };
}
describe('application audit reporting', () => {
  it('counts records beyond the REST row cap without downloading or truncating status rows', async () => {
    const { db, calls } = dbMock();
    const result = await loadApplicationStatusCounts(db);
    expect(result.total).toBe(1501);
    expect(result.statuses.submitted).toBe(1400);
    for (const call of calls) {
      expect(call.options).toEqual({ count: 'exact', head: true });
      expect(call.filters).toHaveLength(2);
      expect(call.filters.join(',')).toContain('email.not.ilike.%@example.com');
    }
  });
  it('uses the same explicitly requested test visibility for all summary counts', async () => {
    const { db, calls } = dbMock();
    await loadApplicationStatusCounts(db, true);
    expect(calls.every((call) => call.filters.length === 0)).toBe(true);
  });
  it('fails visibly rather than returning zero counts when the database fails', async () => {
    await expect(loadApplicationStatusCounts(dbMock(true).db)).rejects.toThrow(
      'APPLICATION_COUNTS_UNAVAILABLE',
    );
  });
  it('keeps applications already being reviewed out of the waiting total', () => {
    expect(APPLICATION_AWAITING_REVIEW_STATUSES).toContain('submitted');
    expect(APPLICATION_AWAITING_REVIEW_STATUSES).not.toContain('under_review');
    expect(APPLICATION_AWAITING_REVIEW_STATUSES).not.toContain('in_review');
  });
  it.each([
    { email: 'application-audit@example.com' },
    { email: 'verify-bot+trial2@elevateforhumanity.org' },
    { email: 'validate-barber-123@test-elevate.internal' },
    { email: 'upload-test-123@test.com' },
    { full_name: '[QA E2E] Applicant' },
  ])('separates explicit test identities: %j', (profile) =>
    expect(isTestOrAuditProfile(profile)).toBe(true),
  );
  it.each([
    { email: 'student@gmail.com', full_name: 'Testa Smith' },
    { email: 'student@elevateforhumanity.org' },
    { email: null, full_name: 'Real Applicant' },
    { email: 'sam@contest.com' },
  ])('preserves real or incomplete applicants: %j', (profile) =>
    expect(isTestOrAuditProfile(profile)).toBe(false),
  );
  it('keeps missing fields in query predicates rather than silently losing applicants', () => {
    const filters: string[] = [];
    const q = {
      or(value: string) {
        filters.push(value);
        return q;
      },
    };
    excludeQaProfiles(q);
    expect(filters[0]).toContain('email.is.null');
    expect(filters[1]).toContain('full_name.is.null');
  });
});
