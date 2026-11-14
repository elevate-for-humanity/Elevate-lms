import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({ enqueue: vi.fn(), hydrate: vi.fn(), db: vi.fn() }));
vi.mock('@/lib/workflows/scheduler', () => ({ enqueueDueWorkflowSchedules: mocks.enqueue }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: mocks.hydrate }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.db }));
import { POST } from '@/apps/admin/app/api/internal/workflow-schedule-processor/route';

function request(authorization = 'Bearer scheduler-test-secret') {
  return new NextRequest('https://admin.example.test/api/internal/workflow-schedule-processor', { method: 'POST', headers: { authorization } });
}

describe('workflow schedule processor HTTP contract', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', 'scheduler-test-secret');
    mocks.db.mockResolvedValue({});
    mocks.enqueue.mockResolvedValue({ observed: 1, queued: 1, failed: 0, truncated: 0 });
  });
  afterEach(() => vi.unstubAllEnvs());

  it('acknowledges a durable queued occurrence without claiming the workflow executed', async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true, observed: 1, queued: 1, failed: 0, truncated: 0 });
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it.each(['Bearer wrong', '', 'scheduler-test-secret'])('rejects an invalid scheduler credential %s before database access', async credential => {
    expect((await POST(request(credential))).status).toBe(401);
    expect(mocks.db).not.toHaveBeenCalled();
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });

  it('fails closed when the configured credential is missing', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await POST(request('Bearer '))).status).toBe(401);
    expect(mocks.enqueue).not.toHaveBeenCalled();
  });

  it.each([{ failed: 1, truncated: 0 }, { failed: 0, truncated: 1 }])('fails the scheduler gate for incomplete work %j', async result => {
    mocks.enqueue.mockResolvedValue(result);
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect((await response.json()).ok).toBe(false);
  });

  it('does not report success when the durable queue is unavailable', async () => {
    mocks.enqueue.mockRejectedValue(new Error('private database error'));
    const response = await POST(request());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: 'Workflow schedule queue unavailable.' });
  });
});
