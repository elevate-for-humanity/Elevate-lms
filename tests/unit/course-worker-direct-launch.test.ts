import { describe, expect, it, vi } from 'vitest';
vi.mock('server-only', () => ({}));
import { startDeployedCourseWorker } from '@/lib/gcp/direct-course-worker-launch';

const jobName = 'projects/elegant-racer-299721/locations/us-central1/jobs/elevate-course-builder';
function response(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: { 'content-type': 'application/json' } });
}
function setup({ active = false, deny = false } = {}) {
  const calls: { url: string; method: string }[] = [];
  const request = vi.fn(async (url: URL | RequestInfo, init?: RequestInit) => {
    const target = String(url);
    calls.push({ url: target, method: init?.method || 'GET' });
    if (target.startsWith('http://metadata.google.internal/')) return response({ access_token: 'test-only' });
    if (target.endsWith('/executions?pageSize=50')) return response({ executions: active ? [{ name: jobName + '/executions/active' }] : [] });
    if (target.endsWith(':run')) return deny ? response({ error: 'forbidden' }, 403) : response({ name: 'operations/test-operation' });
    return response({ name: jobName });
  });
  return { request: request as typeof fetch, calls };
}

describe('Admin one-click Course Builder worker execution', () => {
  it('executes only the configured deployed job using its Cloud Run service identity', async () => {
    const { request, calls } = setup();
    const result = await startDeployedCourseWorker({ request, env: { K_SERVICE: 'elevate-admin-migration' } });
    expect(result.dispatched).toBe(true);
    expect(result.executionVerified).toBe(false);
    expect(calls.filter(x => x.method === 'POST')).toEqual([{ url: 'https://run.googleapis.com/v2/' + jobName + ':run', method: 'POST' }]);
  });

  it('does not launch a duplicate execution when a prior execution is active', async () => {
    const { request, calls } = setup({ active: true });
    const result = await startDeployedCourseWorker({ request, env: { K_SERVICE: 'elevate-admin-migration' } });
    expect(result.alreadyExecuting).toBe(true);
    expect(calls.every(x => x.method === 'GET')).toBe(true);
  });

  it('surfaces Cloud Run IAM denial without inventing execution success', async () => {
    const { request } = setup({ deny: true });
    await expect(startDeployedCourseWorker({ request, env: { K_SERVICE: 'elevate-admin-migration' } })).rejects.toThrow('GOOGLE_COURSE_EXECUTION_REFUSED_HTTP_403');
  });

  it('never calls Cloud Run without production workload identity', async () => {
    const { request, calls } = setup();
    await expect(startDeployedCourseWorker({ request, env: {} })).rejects.toThrow('GOOGLE_CLOUD_RUN_ADMIN_IDENTITY_REQUIRED');
    expect(calls).toHaveLength(0);
  });
});
