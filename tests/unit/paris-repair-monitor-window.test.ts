import { expect, it } from 'vitest';
import { readRecentRepairEvents } from '@/lib/ai/runtime/repair-events';
import { eligibleRepairEvents } from '@/lib/ai/runtime/code-repair-policy.mjs';

const now = Date.parse('2026-10-22T06:00:00Z');
function database(rows: any[], error: any = null) {
  const bounds: any[] = [];
  let lower = '';
  let upper = '';
  const query: any = {
    select: () => query,
    gte: (_key: string, value: string) => { lower = value; return query; },
    lte: (_key: string, value: string) => { upper = value; return query; },
    order: () => query,
    range: async (start: number, end: number) => {
      bounds.push([start, end]);
      return { data: rows.filter(row => row.created_at >= lower && row.created_at <= upper).slice(start, end + 1), error };
    },
  };
  return { db: { from: () => query }, bounds };
}
const failed = (hour: number) => ({
  operation: 'workflow.execute', status: 'failed', failure_category: 'unknown',
  created_at: `2026-10-22T0${hour}:00:00.000Z`,
});

it('retains recurring failure evidence across the observed multi-hour cron delay', async () => {
  const { db } = database([failed(5), failed(4), failed(3)]);
  expect(eligibleRepairEvents(await readRecentRepairEvents(db, now))).toHaveLength(1);
});

it('includes a later recovery and excludes evidence beyond the bounded observation day', async () => {
  const { db } = database([
    { ...failed(5), status: 'completed', failure_category: null },
    failed(4), failed(3), failed(2),
    { ...failed(1), operation: 'old', created_at: '2026-10-20T00:00:00.000Z' },
  ]);
  const events = await readRecentRepairEvents(db, now);
  expect(events).toHaveLength(4);
  expect(eligibleRepairEvents(events)).toEqual([]);
});

it('reads subsequent pages instead of silently dropping less frequent operations', async () => {
  const { db, bounds } = database([...Array.from({ length: 500 }, () => ({ ...failed(5), operation: 'noise', status: 'completed' })), failed(4), failed(3), failed(2)]);
  expect(eligibleRepairEvents(await readRecentRepairEvents(db, now))).toHaveLength(1);
  expect(bounds).toEqual([[0, 499], [500, 999]]);
});

it('fails visibly when the bounded scan or database cannot supply complete evidence', async () => {
  const { db } = database(Array.from({ length: 5000 }, () => failed(5)));
  await expect(readRecentRepairEvents(db, now)).rejects.toThrow('SCAN_LIMIT_EXCEEDED');
  await expect(readRecentRepairEvents(database([], Error('database unavailable')).db, now)).rejects.toThrow('database unavailable');
});
