// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { reconcile } = vi.hoisted(() => ({ reconcile: vi.fn() }));

vi.mock('@/lib/devstudio/openhands/runtime', () => ({ reconcileOpenHandsTasks: reconcile }));
vi.mock('@/lib/api/withRuntime', () => ({ withRuntime: (fn: any) => fn }));

import { GET } from '../../apps/admin/app/api/cron/openhands-reconcile/route';

const TASK_ID = '3f1c2b4a-5d6e-4f70-8a91-0b2c3d4e5f60';

const request = (query = '', authorization = 'Bearer scheduler-secret') =>
  new NextRequest(`https://admin.elevateforhumanity.org/api/cron/openhands-reconcile${query}`, {
    headers: authorization ? { authorization } : {},
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('CRON_SECRET', 'scheduler-secret');
  reconcile.mockResolvedValue({ checked: 1, completed: 0, running: 0, retried: 0, failed: 0, errors: [] });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('OpenHands reconcile endpoint stays scoped to one exact task', () => {
  it('rejects a missing task_id instead of sweeping the queue', async () => {
    const response = await GET(request());
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'A valid task_id is required' });
    expect(reconcile).not.toHaveBeenCalled();
  });

  it('rejects a malformed task_id before touching any task', async () => {
    const response = await GET(request('?task_id=not-a-uuid'));
    expect(response.status).toBe(400);
    expect(reconcile).not.toHaveBeenCalled();
  });

  it('reconciles exactly the requested task with a single-task budget', async () => {
    const response = await GET(request(`?task_id=${TASK_ID}`));
    expect(response.status).toBe(200);
    expect(reconcile).toHaveBeenCalledExactlyOnceWith(1, TASK_ID);
    expect(await response.json()).toMatchObject({ success: true, task_id: TASK_ID });
  });

  it('never widens a targeted retry to the default multi-task budget', async () => {
    await GET(request(`?task_id=${TASK_ID}`));
    expect(reconcile).not.toHaveBeenCalledWith(10);
    expect(reconcile.mock.calls[0][1]).toBe(TASK_ID);
  });

  it('rejects an unauthenticated caller without reconciling', async () => {
    const response = await GET(request(`?task_id=${TASK_ID}`, 'Bearer wrong-secret'));
    expect(response.status).toBe(401);
    expect(reconcile).not.toHaveBeenCalled();
  });

  it('rejects a caller when no scheduler secret is configured', async () => {
    vi.stubEnv('CRON_SECRET', undefined);
    const response = await GET(request(`?task_id=${TASK_ID}`));
    expect(response.status).toBe(401);
    expect(reconcile).not.toHaveBeenCalled();
  });
});
