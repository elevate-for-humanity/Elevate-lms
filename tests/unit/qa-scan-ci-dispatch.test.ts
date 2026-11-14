// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ getToken: vi.fn() }));
vi.mock('@/lib/devstudio/github-token', () => ({ getGitHubToken: state.getToken }));
import { GET } from '@/apps/admin/app/api/cron/qa-scan/route';
const provider = vi.fn();
const request = (authorization = 'Bearer cron-test-secret') => new NextRequest('https://admin.elevateforhumanity.org/api/cron/qa-scan', { headers: { authorization } });
beforeEach(() => {
  vi.stubEnv('CRON_SECRET', 'cron-test-secret');
  vi.stubGlobal('fetch', provider);
  state.getToken.mockReset().mockResolvedValue('github-test-token');
  provider.mockReset().mockResolvedValue(new Response(null, { status: 204 }));
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('QA checks run in CI', () => {
  it('rejects unauthorized requests before resolving credentials or dispatching', async () => {
    expect((await GET(request('Bearer wrong'))).status).toBe(401);
    expect(state.getToken).not.toHaveBeenCalled();
    expect(provider).not.toHaveBeenCalled();
  });
  it('requires a configured cron secret even when the header says Bearer undefined', async () => {
    vi.stubEnv('CRON_SECRET', '');
    expect((await GET(request('Bearer undefined'))).status).toBe(401);
    expect(provider).not.toHaveBeenCalled();
  });
  it('queues the established CI workflow without claiming completed checks', async () => {
    const result = await GET(request());
    expect(result.status).toBe(202);
    expect(await result.json()).toMatchObject({ status: 'queued', workflow: 'ci.yml', ref: 'main' });
    expect(provider).toHaveBeenCalledWith('https://api.github.com/repos/elevate-for-humanity/Elevate-lms/actions/workflows/ci.yml/dispatches', expect.objectContaining({ method: 'POST', body: JSON.stringify({ ref: 'main' }), cache: 'no-store' }));
  });
  it('reports provider rejection rather than a successful QA scan', async () => {
    provider.mockResolvedValue(new Response(null, { status: 403 }));
    const result = await GET(request());
    expect(result.status).toBe(502);
    expect(await result.json()).toMatchObject({ status: 'failed', providerStatus: 403 });
  });
  it('reports unavailable credentials without making a provider call', async () => {
    state.getToken.mockResolvedValue(null);
    expect((await GET(request())).status).toBe(503);
    expect(provider).not.toHaveBeenCalled();
  });
  it('reports a transport failure without exposing credentials', async () => {
    provider.mockRejectedValue(new Error('transport failed with secret material'));
    const result = await GET(request());
    expect(result.status).toBe(503);
    expect(JSON.stringify(await result.json())).not.toContain('secret material');
  });
});
