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

describe('complete execution history before launching', () => {
  function pages(second: unknown, status = 200) {
    const calls: string[] = [];
    const request = vi.fn(async (url: URL | RequestInfo) => {
      const target = String(url); calls.push(target);
      if (target.startsWith('http://metadata.google.internal/')) return response({ access_token: 'test-only' });
      if (target.includes('pageToken=')) return response(second, status);
      if (target.includes('/executions?')) return response({
        executions: Array.from({ length: 50 }, (_, i) => ({ name: String(i), completionTime: '2026-10-01T00:00:00Z' })),
        nextPageToken: 'next/older+page',
      });
      if (target.endsWith(':run')) return response({ name: 'operations/paged' });
      return response({ name: jobName });
    });
    return { request: request as typeof fetch, calls };
  }
  it('finds active work beyond 50 completed executions without launching another', async () => {
    const { request, calls } = pages({ executions: [{ name: jobName + '/executions/older-active' }] });
    const result = await startDeployedCourseWorker({ request, env: { K_SERVICE: 'admin' } });
    expect(result.executionName).toContain('older-active');
    expect(calls.some(url => url.endsWith(':run'))).toBe(false);
    expect(calls.some(url => url.includes('pageToken=next%2Folder%2Bpage'))).toBe(true);
  });
  it('launches only after all history pages have no active execution', async () => {
    const { request, calls } = pages({ executions: [{ conditions: [{ type: 'Completed', state: 'CONDITION_FAILED' }] }] });
    expect((await startDeployedCourseWorker({ request, env: { K_SERVICE: 'admin' } })).operationName).toBe('operations/paged');
    expect(calls.at(-1)).toContain(':run');
  });
  it('does not launch when a later history page is unreadable', async () => {
    const { request, calls } = pages({}, 503);
    await expect(startDeployedCourseWorker({ request, env: { K_SERVICE: 'admin' } })).rejects.toThrow('EXECUTIONS_UNAVAILABLE_HTTP_503');
    expect(calls.some(url => url.endsWith(':run'))).toBe(false);
  });
  it('rejects repeated pagination tokens without launching', async () => {
    const { request, calls } = pages({ executions: [], nextPageToken: 'next/older+page' });
    await expect(startDeployedCourseWorker({ request, env: { K_SERVICE: 'admin' } })).rejects.toThrow('PAGE_CYCLE');
    expect(calls.some(url => url.endsWith(':run'))).toBe(false);
  });
});
