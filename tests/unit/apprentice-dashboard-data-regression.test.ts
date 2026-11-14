import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: vi.fn() }));
import { loadRegisteredApprenticeshipProgress } from '@/lib/apprenticeship/progress-service';
import { recordedHours } from '@/lib/apprenticeship/recorded-hours';

const context: any = {
  enrollment: { id: 'enrollment', transfer_hours: 25, transfer_hours_verified: true },
  studentId: 'learner', programSlug: 'barber-apprenticeship', placement: null,
  contract: { standardVersionKey: 'v1', standard: { competencies: [{ id: 'c1' }] },
    completion: { competencyCount: 1, requiredRtiHours: 260 } },
};
function database(tables: Record<string, any[]>, failPage?: number) {
  const filters: any[] = [];
  return { filters, from(table: string) {
    const q: any = {
      select: () => q, eq: (key: string, value: any) => { filters.push([table, key, value]); return q; },
      order: () => q,
      then: (resolve: any, reject: any) => Promise.resolve({ data: tables[table] || [], error: null }).then(resolve, reject),
      range: async (from: number, to: number) => ({
        data: tables[table]?.slice(from, to + 1) || [],
        error: from === failPage ? new Error('later page unavailable') : null,
      }),
    }; return q;
  } };
}
describe('apprentice dashboard recorded evidence', () => {
  it('preserves accepted zero and rejects malformed/negative amounts', () => {
    expect(recordedHours({ accepted_hours: 0, hours_claimed: 8 })).toBe(0);
    expect(recordedHours({ accepted_hours: null, hours_claimed: '2.5' })).toBe(2.5);
    expect(recordedHours({ accepted_hours: -2, hours_claimed: 8 })).toBe(0);
    expect(recordedHours({ accepted_hours: 'invalid', hours_claimed: 8 })).toBe(0);
  });
  it('reads all pages, keeps OJL separate from RTI/transfer and respects zero acceptance', async () => {
    const db = database({
      apprentice_competency_records: [], apprenticeship_rti_entries: [],
      hour_entries: [
        ...Array.from({ length: 1001 }, (_, id) => ({ id, status: 'approved', source_type: 'ojl', hours_claimed: 1 })),
        { status: 'approved', source_type: 'rti', hours_claimed: 100 },
        { status: 'approved', source_type: 'ojl', category: 'transfer', hours_claimed: 100 },
        { status: 'approved', source_type: 'ojl', accepted_hours: 0, hours_claimed: 100 },
      ],
    });
    const result = await loadRegisteredApprenticeshipProgress(db as any, context);
    expect(result.ojl.approvedHours).toBe(1001);
    expect(result.ojl.totalCreditedHours).toBe(1026);
    expect(db.filters).toContainEqual(['hour_entries', 'user_id', 'learner']);
    expect(db.filters).toContainEqual(['hour_entries', 'program_slug', 'barber-apprenticeship']);
  });
  it('does not return partial totals when a later page fails', async () => {
    const db = database({ hour_entries: Array.from({ length: 501 }, () => ({ status: 'approved', source_type: 'ojl', hours_claimed: 1 })) }, 500);
    await expect(loadRegisteredApprenticeshipProgress(db as any, context)).rejects.toThrow('later page unavailable');
  });
  it('only credits verified transfer evidence', async () => {
    const db = database({});
    const result = await loadRegisteredApprenticeshipProgress(db as any, {
      ...context, enrollment: { ...context.enrollment, transfer_hours_verified: false },
    });
    expect(result.ojl.transferHours).toBe(0);
  });
});
