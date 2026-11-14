// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), db: vi.fn() }));
vi.mock('@/lib/devstudio/api-auth', () => ({ apiRequireDevStudio: mocks.auth }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.db }));
import { GET } from '@/apps/admin/app/api/admin/dev-studio/courses/health/route';

type QueuedJob = { id: string; attempts: number; max_attempts: number };
function database(rows: QueuedJob[], options: {
  pageLimit?: number; failAt?: number; truncateAt?: number;
  reportedCount?: (page: number) => number | null;
} = {}) {
  const pages: { from: number; to: number; filters: unknown[]; order: unknown[] }[] = [];
  const mutate = vi.fn();
  const from = vi.fn(() => {
    let scan = false, range: [number, number] = [0, 0];
    const filters: unknown[] = [], order: unknown[] = [];
    const query = {
      select: (columns: string) => { scan = columns === 'id,attempts,max_attempts'; return query; },
      eq: (...args: unknown[]) => { filters.push(args); return query; },
      in: () => query, or: () => query, gte: () => query, limit: () => query,
      order: (...args: unknown[]) => { order.push(args); return query; },
      range: (start: number, end: number) => { range = [start, end]; return query; },
      update: mutate, insert: mutate, delete: mutate, upsert: mutate,
      then: (resolve: (result: unknown) => unknown) => {
        if (!scan) return resolve({ data: [], error: null, count: 0 });
        const page = pages.length;
        pages.push({ from: range[0], to: range[1], filters, order });
        const end = Math.min(range[1] + 1, range[0] + (options.pageLimit ?? 500), options.truncateAt ?? rows.length);
        return resolve({
          data: rows.slice(range[0], Math.max(range[0], end)),
          error: options.failAt === page ? { message: 'private database error' } : null,
          count: options.reportedCount ? options.reportedCount(page) : rows.length,
        });
      },
    };
    return query;
  });
  mocks.db.mockResolvedValue({ from });
  return { pages, mutate };
}
const jobs = (count: number) => Array.from({ length: count }, (_, i) => ({
  id: `job-${String(i).padStart(5, '0')}`, attempts: 0, max_attempts: 3,
}));
const request = () => new NextRequest('https://admin.example/api/admin/dev-studio/courses/health');
const budgetCheck = (body: { checks: { name: string }[] }) => body.checks.find(check => check.name === 'queued-retry-budgets');

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ id: 'admin' });
  vi.stubEnv('GOOGLE_CLOUD_PROJECT', 'test-project');
  vi.stubEnv('ULTIMATE_PHOTO_REGION', 'us');
  vi.stubEnv('ULTIMATE_PHOTO_MODEL', 'gemini-3.1-flash-image');
});
afterEach(() => vi.unstubAllEnvs());

describe('Dev Studio queued course retry budgets', () => {
  it('preserves authentication before opening the privileged database', async () => {
    mocks.auth.mockResolvedValue({ error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) });
    expect((await GET(request())).status).toBe(403);
    expect(mocks.db).not.toHaveBeenCalled();
  });

  it.each([0, 4])('reports a fully inspected claimable queue as healthy (%s jobs)', async count => {
    const db = database(jobs(count));
    const response = await GET(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(body).toMatchObject({ status: 'healthy', configured: true });
    expect(budgetCheck(body)).toMatchObject({ passed: true, required: false });
    expect(db.mutate).not.toHaveBeenCalled();
  });

  it('finds an exhausted queued job beyond the first API page without resetting it', async () => {
    const rows = jobs(1101);
    rows[1100].attempts = 3;
    const db = database(rows, { pageLimit: 137 });
    const body = await (await GET(request())).json();
    expect(body).toMatchObject({ status: 'degraded', configured: true });
    expect(budgetCheck(body)).toMatchObject({ passed: false, required: false, message: expect.stringContaining('1 queued course build job(s) cannot be claimed') });
    expect(db.pages.length).toBe(9);
    expect(db.pages[1].from).toBe(137);
    expect(db.pages.every(page => page.filters.length === 1 && JSON.stringify(page.filters[0]) === '["status","queued"]')).toBe(true);
    expect(db.pages.every(page => JSON.stringify(page.order) === '[["id",{"ascending":true}]]')).toBe(true);
    expect(db.mutate).not.toHaveBeenCalled();
  });

  it('keeps a failed retry-budget read advisory and does not expose database errors', async () => {
    database(jobs(1), { failAt: 0 });
    const response = await GET(request());
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body).toMatchObject({ status: 'degraded', configured: true });
    expect(budgetCheck(body)).toMatchObject({ passed: false, required: false });
    expect(JSON.stringify(body)).not.toContain('private database error');
  });

  it('never treats a truncated result as a complete healthy count', async () => {
    database(jobs(3), { truncateAt: 2 });
    const body = await (await GET(request())).json();
    expect(body.status).toBe('degraded');
    expect(budgetCheck(body)).toMatchObject({ passed: false, message: expect.stringContaining('could not be fully inspected') });
  });

  it('requires an exact total and rejects a count that changes during pagination', async () => {
    database(jobs(2), { reportedCount: () => null });
    expect((await (await GET(request())).json()).status).toBe('degraded');
    database(jobs(2), { pageLimit: 1, reportedCount: page => page === 0 ? 2 : 3 });
    expect((await (await GET(request())).json()).status).toBe('degraded');
  });

  it('does not call invalid retry-budget records healthy', async () => {
    database([{ id: 'invalid-job', attempts: 0, max_attempts: 0 }]);
    expect((await (await GET(request())).json()).status).toBe('degraded');
  });

  it('bounds health inspection and reports incomplete coverage instead of false success', async () => {
    const db = database(jobs(10001));
    const body = await (await GET(request())).json();
    expect(db.pages).toHaveLength(20);
    expect(body.status).toBe('degraded');
    expect(budgetCheck(body)).toMatchObject({ passed: false, message: expect.stringContaining('could not be fully inspected') });
    expect(db.mutate).not.toHaveBeenCalled();
  });
});
