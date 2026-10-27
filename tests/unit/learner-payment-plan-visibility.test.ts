import { describe, expect, it, vi } from 'vitest';
import { learnerCanSeeBilling } from '@/lib/billing/learner-payment-plan-visibility';

vi.mock('@/lib/logger', () => ({ logger: { warn: vi.fn() } }));

function database(rows: Record<string, any[]>, unavailable?: string) {
  const calls: Array<{ table: string; filters: Array<[string, string, any]> }> = [];
  const db = { from(table: string) {
    const call = { table, filters: [] as Array<[string, string, any]> };
    calls.push(call);
    const query: any = {
      select: () => query,
      eq: (key: string, value: any) => { call.filters.push(['eq', key, value]); return query; },
      neq: (key: string, value: any) => { call.filters.push(['neq', key, value]); return query; },
      in: (key: string, value: any) => { call.filters.push(['in', key, value]); return query; },
      not: (key: string) => { call.filters.push(['not-null', key, null]); return query; },
      limit: () => query,
      then(resolve: any, reject: any) {
        const data = (rows[table] || []).filter(row => call.filters.every(([op, key, value]) =>
          op === 'eq' ? row[key] === value : op === 'neq' ? row[key] !== value :
            op === 'in' ? value.includes(row[key]) : row[key] != null));
        return Promise.resolve({ data, error: unavailable === table ? new Error('unavailable') : null }).then(resolve, reject);
      },
    };
    return query;
  } };
  return { db, calls };
}

describe('learner billing visibility', () => {
  it.each(['apprentice', 'barber_apprentice', 'cosmetology_apprentice'])('retains billing for %s without a plan lookup', async role => {
    const { db, calls } = database({});
    expect(await learnerCanSeeBilling(db, 'learner', role)).toBe(true);
    expect(calls).toHaveLength(0);
  });

  it.each(['wioa', 'self_pay'])('does not infer a personal plan from %s funding', async funding => {
    const { db } = database({ program_enrollments: [{ user_id: 'learner', funding_source: funding }] });
    expect(await learnerCanSeeBilling(db, 'learner', 'student')).toBe(false);
  });

  it('shows an active personal plan belonging to this learner', async () => {
    const { db } = database({ payment_plans: [{ id: 'plan', user_id: 'learner', status: 'active' }] });
    expect(await learnerCanSeeBilling(db, 'learner', 'student')).toBe(true);
  });

  it.each(['active', 'paused'])('shows an owned %s billing schedule', async status => {
    const { db } = database({
      billing_migration_authorizations: [{ user_id: 'learner', billing_schedule_id: 'owned', status: 'approved' }],
      billing_schedules: [{ id: 'owned', status }],
    });
    expect(await learnerCanSeeBilling(db, 'learner', 'student')).toBe(true);
  });

  it('hides canceled plans and never uses another learner’s schedule', async () => {
    const { db, calls } = database({
      payment_plans: [{ id: 'old', user_id: 'learner', status: 'canceled' }],
      billing_migration_authorizations: [
        { user_id: 'learner', billing_schedule_id: 'owned', status: 'approved' },
        { user_id: 'other', billing_schedule_id: 'foreign', status: 'approved' },
      ],
      billing_schedules: [{ id: 'owned', status: 'canceled' }, { id: 'foreign', status: 'active' }],
    });
    expect(await learnerCanSeeBilling(db, 'learner', 'student')).toBe(false);
    expect(calls.find(call => call.table === 'billing_schedules')?.filters).toContainEqual(['in', 'id', ['owned']]);
  });

  it.each(['payment_plans', 'billing_migration_authorizations', 'billing_schedules'])('hides billing when %s is unavailable', async table => {
    const { db } = database({
      billing_migration_authorizations: [{ user_id: 'learner', billing_schedule_id: 'owned', status: 'approved' }],
      billing_schedules: [{ id: 'owned', status: 'active' }],
    }, table);
    expect(await learnerCanSeeBilling(db, 'learner', 'student')).toBe(false);
  });
});
