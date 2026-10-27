// @vitest-environment node
import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ denied: false, getToken: vi.fn() }));
vi.mock('@/lib/devstudio/api-auth', () => ({ apiRequireDevStudio: async () => ({ error: state.denied ? NextResponse.json({ error: 'Forbidden' }, { status: 403 }) : null }) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/devstudio/github-token', () => ({ getGitHubToken: state.getToken }));
import { POST } from '@/apps/admin/app/api/admin/dev-studio/stabilize/route';
const provider = vi.fn();
const request = (body = {}) => new NextRequest('https://admin.elevateforhumanity.org/api/admin/dev-studio/stabilize', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
beforeEach(() => { state.denied = false; state.getToken.mockReset().mockResolvedValue('github-test-token'); provider.mockReset().mockResolvedValue(new Response(null, { status: 204 })); vi.stubGlobal('fetch', provider); });
afterEach(() => vi.unstubAllGlobals());
it('keeps the Dev Studio access boundary before queueing checks', async () => {
  state.denied = true;
  expect((await POST(request())).status).toBe(403);
  expect(provider).not.toHaveBeenCalled();
});
it('queues canonical source checks without inventing completed step results', async () => {
  const result = await POST(request());
  expect(result.status).toBe(202);
  expect(await result.json()).toMatchObject({ status: 'queued', workflow: 'ci.yml', results: [] });
  expect(provider).toHaveBeenCalledTimes(1);
});
it('rejects invalid output limits before starting a workflow', async () => {
  expect((await POST(request({ maxOutputKb: 4096 }))).status).toBe(400);
  expect(provider).not.toHaveBeenCalled();
});
it('reports a rejected CI dispatch without a successful stabilization status', async () => {
  provider.mockResolvedValue(new Response(null, { status: 403 }));
  const result = await POST(request());
  expect(result.status).toBe(502);
  expect(await result.json()).toMatchObject({ status: 'failed', providerStatus: 403 });
});
