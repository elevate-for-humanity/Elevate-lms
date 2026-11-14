// @vitest-environment node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/withRuntime', () => ({
  withRuntime: (handler: (request: Request) => Promise<Response>) => handler,
}));
vi.mock('@/lib/devstudio/openhands/runtime', () => ({
  reconcileOpenHandsTasks: vi.fn(),
}));

import { GET } from '../../apps/admin/app/api/cron/openhands-reconcile/route';
import { reconcileOpenHandsTasks } from '@/lib/devstudio/openhands/runtime';

const source = (file: string) => readFileSync(path.join(process.cwd(), file), 'utf8');
const taskId = '550e8400-e29b-41d4-a716-446655440000';
const request = (query = '', authorization = 'Bearer scheduler-secret') =>
  new Request(`https://admin.elevateforhumanity.org/api/cron/openhands-reconcile${query}`, {
    headers: { authorization },
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('CRON_SECRET', 'scheduler-secret');
  vi.mocked(reconcileOpenHandsTasks).mockResolvedValue({ errors: [], processed: 0 } as any);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe('exact OpenHands reconciliation contract', () => {
  it('scopes the provider queue query to one requested task', () => {
    const runtime = source('lib/devstudio/openhands/runtime.ts');
    expect(runtime).toContain("if (taskId) query = query.eq('id', taskId)");
    expect(runtime).toContain('limit(taskId ? 1 :');
  });

  it('rejects missing scheduler configuration before attempting reconciliation', async () => {
    vi.stubEnv('CRON_SECRET', undefined);
    const response = await GET(request('', 'Bearer undefined'));
    expect(response.status).toBe(401);
    expect(reconcileOpenHandsTasks).not.toHaveBeenCalled();
  });

  it('rejects an incorrect scheduler token before attempting reconciliation', async () => {
    const response = await GET(request('', 'Bearer incorrect-token'));
    expect(response.status).toBe(401);
    expect(reconcileOpenHandsTasks).not.toHaveBeenCalled();
  });

  it.each(['?task_id=not-a-uuid', '?task_id=550e8400-e29b-91d4-a716-446655440000'])(
    'rejects a supplied invalid task identifier: %s', async query => {
      const response = await GET(request(query));
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ error: 'Invalid task_id' });
      expect(reconcileOpenHandsTasks).not.toHaveBeenCalled();
    },
  );

  it('runs only one requested UUID task and returns that exact identity', async () => {
    const response = await GET(request(`?task_id=${taskId}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: true, task_id: taskId });
    expect(reconcileOpenHandsTasks).toHaveBeenCalledExactlyOnceWith(1, taskId);
  });

  it.each(['', '?task_id=%20%20'])(
    'preserves authenticated scheduled reconciliation with no UUID: %s', async query => {
      const response = await GET(request(query));
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ success: true, task_id: null });
      expect(reconcileOpenHandsTasks).toHaveBeenCalledExactlyOnceWith(10, undefined);
    },
  );

  it('does not claim success when the provider reconciler reports errors', async () => {
    vi.mocked(reconcileOpenHandsTasks).mockResolvedValue({ errors: ['provider unavailable'] } as any);
    const response = await GET(request(`?task_id=${taskId}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ success: false, task_id: taskId });
    expect(reconcileOpenHandsTasks).toHaveBeenCalledExactlyOnceWith(1, taskId);
  });
});
