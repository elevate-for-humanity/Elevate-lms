// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import { runHealthProbe } from '@/lib/devstudio/health-probes.mjs';

const mocks = vi.hoisted(() => ({ auth: vi.fn(), secrets: vi.fn(), ai: vi.fn(), cloudflare: vi.fn(), token: vi.fn() }));
vi.mock('@/lib/devstudio/api-auth', () => ({ apiRequireDevStudio: mocks.auth }));
vi.mock('@/lib/ai/provider-runtime', () => ({ readAIHealthSecrets: mocks.secrets, resolveAIRuntimeState: mocks.ai, probeCloudflareWorkersAI: mocks.cloudflare }));
vi.mock('@/lib/devstudio/github-token', () => ({ getGitHubToken: mocks.token }));
vi.mock('@/lib/google/runtime', () => ({ isGoogleRuntimeReady: () => true, googleProjectId: () => 'fixture-project', getGoogleServices: () => [{ key: 'marketing', id: 'marketing-service' }] }));

const request = (signal?: AbortSignal) => new NextRequest('https://admin.example/api/admin/dev-studio/health', { signal });
const ownedReady = () => ({ providers: { groq: true }, activeProvider: 'elevate', elevate: true, anyConfigured: true, ownedModel: { configured: true, verified: true, status: 'reachable' } });
let handle: (req: NextRequest) => Promise<NextResponse>;

beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ id: 'admin' });
  mocks.secrets.mockResolvedValue({ OPENAI_API_KEY: 'private-selected-secret' });
  mocks.ai.mockResolvedValue(ownedReady());
  mocks.cloudflare.mockResolvedValue({ configured: true, reachable: true, status: 'reachable' });
  mocks.token.mockResolvedValue('private-installation-token');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://fixture.invalid');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'private-service-key');
  handle = (await import('@/lib/devstudio/health-handler')).handleDevStudioHealth;
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe('bounded concurrent Studio health', () => {
  it('starts independent probes concurrently rather than waiting for model warmup', async () => {
    mocks.ai.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(ownedReady()), 1000)));
    mocks.token.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve('private-installation-token'), 1000)));
    const pending = handle(request());
    await vi.advanceTimersByTimeAsync(0);
    expect(mocks.ai).toHaveBeenCalledOnce();
    expect(mocks.token).toHaveBeenCalledOnce();
    expect(mocks.cloudflare).toHaveBeenCalledOnce();
    expect(mocks.secrets).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1000);
    const body = await (await pending).json();
    expect(body).toMatchObject({ hasElevate: true, githubTokenValid: true, execution: { ready: true, verifiedEndToEnd: false } });
    expect(body.probes.ai.status).toBe('completed');
  });

  it('returns successful checks and cancels a hung model probe before the client deadline', async () => {
    const abort = vi.fn();
    mocks.ai.mockImplementation(({ signal }: { signal: AbortSignal }) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => { abort(); reject(signal.reason); }, { once: true });
    }));
    const pending = handle(request());
    await vi.advanceTimersByTimeAsync(8000);
    const response = await pending, body = await response.json();
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
    expect(body).toMatchObject({ githubTokenValid: true, hasCloudflare: true, hasElevate: false, execution: { ready: false, status: 'verification-incomplete' } });
    expect(body.probes.ai.status).toBe('timed_out');
    expect(body.probes.github.status).toBe('completed');
    expect(body.google.services).toEqual([{ key: 'marketing', id: 'marketing-service' }]);
    expect(abort).toHaveBeenCalledOnce();
    expect(JSON.stringify(body)).not.toContain('private-');
  });

  it('bounds a hung scoped secret read while retaining independent GitHub evidence', async () => {
    const abort = vi.fn();
    mocks.secrets.mockImplementation((signal: AbortSignal) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => { abort(); reject(signal.reason); }, { once: true });
    }));
    const pending = handle(request());
    await vi.advanceTimersByTimeAsync(4000);
    const body = await (await pending).json();
    expect(body.githubTokenValid).toBe(true);
    expect(body.probes.ai.status).toBe('timed_out');
    expect(body.probes.cloudflare.status).toBe('timed_out');
    expect(mocks.ai).not.toHaveBeenCalled();
    expect(mocks.cloudflare).not.toHaveBeenCalled();
    expect(abort).toHaveBeenCalledOnce();
  });

  it('does not remove verified core prerequisites when the optional Cloudflare check times out', async () => {
    mocks.cloudflare.mockImplementation(({ signal }: { signal: AbortSignal }) => new Promise((_, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    }));
    const pending = handle(request());
    await vi.advanceTimersByTimeAsync(8000);
    expect(await (await pending).json()).toMatchObject({
      hasElevate: true, githubTokenValid: true,
      execution: { ready: true, status: 'prerequisites-configured-not-tested' },
      probes: { ai: { status: 'completed' }, github: { status: 'completed' }, cloudflare: { status: 'timed_out' } },
    });
  });

  it('honors the overall deadline even when a probe ignores cancellation', async () => {
    const overall = new AbortController();
    const pending = runHealthProbe(() => new Promise(() => {}), { signal: overall.signal, timeoutMs: 20_000 });
    setTimeout(() => overall.abort(new DOMException('Overall budget', 'TimeoutError')), 10_000);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await pending).toMatchObject({ status: 'timed_out' });
  });

  it('authenticates every caller before sharing active work and never exposes it to a denied caller', async () => {
    mocks.ai.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(ownedReady()), 1000)));
    const first = handle(request());
    await vi.advanceTimersByTimeAsync(0);
    mocks.auth.mockResolvedValue({ error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) });
    expect((await handle(request())).status).toBe(403);
    expect(mocks.secrets).toHaveBeenCalledOnce();
    expect(mocks.token).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1000);
    expect((await first).status).toBe(200);
  });

  it('coalesces concurrent refreshes without making one caller cancellation cancel another', async () => {
    mocks.ai.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(ownedReady()), 1000)));
    const caller = new AbortController();
    const first = handle(request(caller.signal)), second = handle(request());
    await vi.advanceTimersByTimeAsync(0);
    caller.abort();
    expect(mocks.auth).toHaveBeenCalledTimes(2);
    expect(mocks.secrets).toHaveBeenCalledOnce();
    expect(mocks.ai).toHaveBeenCalledOnce();
    expect(mocks.token).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(1000);
    expect(await (await second).json()).toMatchObject({ githubTokenValid: true, hasElevate: true });
    expect((await first).status).toBe(200);
  });

  it('does not cache failures as missing secrets and redacts arbitrary provider exceptions', async () => {
    mocks.secrets.mockRejectedValueOnce(new Error('private-selected-secret failure'));
    mocks.token.mockRejectedValueOnce(new Error('private-installation-token failure'));
    const first = await handle(request());
    const body = await first.json();
    expect(body.probes.ai.status).toBe('unavailable');
    expect(body.githubAuthError).toBe('github_authentication_unavailable');
    expect(JSON.stringify(body)).not.toContain('private-');
    const recovered = await (await handle(request())).json();
    expect(recovered).toMatchObject({ hasElevate: true, githubTokenValid: true });
    expect(mocks.secrets).toHaveBeenCalledTimes(2);
  });
});
