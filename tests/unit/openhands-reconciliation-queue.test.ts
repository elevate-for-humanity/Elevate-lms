// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { loadOpenHandsReconciliationQueue } from '../../lib/devstudio/openhands/reconciliation-queue';

function database(rows: any[], failure = false) {
  const queries: any[] = [];
  return { queries, from: () => {
    const query: any = { filters: [], orders: [], start: 0, end: Infinity };
    queries.push(query);
    query.select = () => query;
    query.eq = (key: string, value: unknown) => { query.filters.push([key, value]); return query; };
    query.order = (key: string) => { query.orders.push(key); return query; };
    query.limit = (size: number) => { query.end = size - 1; return query; };
    query.range = (start: number, end: number) => { query.start = start; query.end = end; return query; };
    query.then = (resolve: any) => {
      const filtered = rows.filter(row => query.filters.every(([key, value]: any) =>
        (key === 'result_json->evaluation->>status' ? row.result_json?.evaluation?.status : row[key]) === value));
      return Promise.resolve({ data: filtered.slice(query.start, query.end + 1), error: failure ? { message: 'database unavailable' } : null }).then(resolve);
    };
    return query;
  }};
}
const task = (id: string, status: string, extra = {}) => ({ id, status, tool_name: 'openhands.execute', attempts: 1, max_attempts: 3, ...extra });
const retryable = { result_json: { evaluation: { status: 'FAIL_RETRYABLE' } } };

describe('OpenHands scheduled reconciliation queue', () => {
  it('keeps old failed history out and prioritizes running work', async () => {
    const db = database([...Array.from({ length: 12 }, (_, n) => task(`old-${n}`, 'failed')), task('active', 'running'), task('retry', 'failed', retryable)]);
    expect((await loadOpenHandsReconciliationQueue(db as any, 2)).map(t => t.id)).toEqual(['active', 'retry']);
  });
  it('pages past exhausted failures to find a recoverable task', async () => {
    const db = database([...Array.from({ length: 100 }, (_, n) => task(`exhausted-${n}`, 'failed', { ...retryable, attempts: 3 })), task('retry', 'failed', retryable)]);
    expect((await loadOpenHandsReconciliationQueue(db as any, 1)).map(t => t.id)).toEqual(['retry']);
    expect(db.queries).toHaveLength(3);
  });
  it('does not query failed work when active work fills the budget', async () => {
    const db = database([task('active', 'running'), task('retry', 'failed', retryable)]);
    expect(await loadOpenHandsReconciliationQueue(db as any, 1)).toHaveLength(1);
    expect(db.queries).toHaveLength(1);
  });
  it('leaves exhausted and terminal failures untouched', async () => {
    const db = database([task('terminal', 'failed'), task('exhausted', 'failed', { ...retryable, attempts: 3 })]);
    expect(await loadOpenHandsReconciliationQueue(db as any, 10)).toEqual([]);
  });
  it('surfaces database errors instead of reporting an empty successful queue', async () => {
    await expect(loadOpenHandsReconciliationQueue(database([], true) as any, 10)).rejects.toThrow('database unavailable');
  });
});
