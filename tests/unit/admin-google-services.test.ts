import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), rate: vi.fn(), secret: vi.fn(), fetch: vi.fn() }));
vi.mock('next/server', () => ({ NextResponse: { json: (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), { ...init, headers: { 'Content-Type': 'application/json' } }) } }));
vi.mock('@/lib/devstudio/api-auth', () => ({ apiRequireDevStudio: mocks.auth }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: mocks.rate }));
vi.mock('@/lib/secrets', () => ({ getDecryptedPlatformSecret: mocks.secret }));
vi.mock('@/lib/devstudio/github-token', () => ({ getGitHubToken: mocks.secret }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { info: vi.fn() } }));
vi.mock('@/lib/api/safe-error', () => ({
  safeError: (error: string, status: number) => new Response(JSON.stringify({ error }), { status }),
  safeInternalError: () => new Response('{}', { status: 500 }),
}));
vi.mock('@/lib/security/require-confirmation', () => ({
  requireTypedConfirmation: (value: string) => ({ ok: value === 'CONFIRM DEPLOY', required: 'CONFIRM DEPLOY' }),
}));
vi.mock('@/lib/routing/portal-map', () => ({
  MARKETING_HOST: 'https://www.elevateforhumanity.org',
  ADMIN_HOST: 'https://admin.elevateforhumanity.org',
  LMS_HOST: 'https://app.elevateforhumanity.org',
}));
import { GET, POST } from '@/apps/admin/app/api/admin/dev-studio/services/route';
import { POST as BUILD_POST } from '@/apps/admin/app/api/admin/dev-studio/builds/route';
const request = (body = {}) => ({ json: async () => body }) as any;
describe('Google Admin service operations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ id: 'admin-user' });
    mocks.rate.mockResolvedValue(null);
    mocks.secret.mockResolvedValue('private-test-token');
    vi.stubGlobal('fetch', mocks.fetch);
  });
  it('denies unauthorized service reads and operations without probing providers', async () => {
    mocks.auth.mockResolvedValue({ error: new Response('{}', { status: 403 }) });
    expect((await GET(request())).status).toBe(403);
    expect((await POST(request())).status).toBe(403);
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.secret).not.toHaveBeenCalled();
  });
  it('does not accept a healthy response from the wrong service', async () => {
    mocks.fetch.mockResolvedValue(new Response(JSON.stringify({
      service: 'marketing', healthy: true, ready: true,
      configuration: { ok: true }, dependencies: { supabase: { ok: true } }, commit: 'a'.repeat(40),
    }), { status: 200 }));
    const body = await (await GET(request())).json();
    expect(body.services.map((s: any) => s.healthy)).toEqual([true, false, false]);
    expect(body.services.every((s: any) => s.provider === 'google-cloud-run')).toBe(true);
  });
  it('requires a real confirmation and full image revision before accessing secrets', async () => {
    expect((await POST(request({ service: 'lms', action: 'deploy' }))).status).toBe(409);
    expect((await POST(request({ service: 'lms', action: 'deploy', confirmation: 'CONFIRM DEPLOY', image_sha: 'latest' }))).status).toBe(400);
    expect(mocks.secret).not.toHaveBeenCalled();
  });
  it('queues only the selected Google deployment and never returns credentials', async () => {
    mocks.fetch.mockResolvedValue(new Response(null, { status: 204 }));
    const response = await POST(request({ service: 'lms', action: 'deploy', confirmation: 'CONFIRM DEPLOY', image_sha: 'a'.repeat(40) }));
    expect(response.status).toBe(202);
    const [url, options] = mocks.fetch.mock.calls[0];
    expect(url).toContain('/deploy-google-repaired.yml/dispatches');
    expect(JSON.parse(options.body)).toEqual({ ref: 'main', inputs: { component: 'lms', image_sha: 'a'.repeat(40) } });
    expect(await response.text()).not.toContain('private-test-token');
  });
  it('reports workflow rejection as failure and never falls back to Northflank', async () => {
    mocks.fetch.mockResolvedValue(new Response('{}', { status: 403 }));
    expect((await POST(request({ service: 'admin', action: 'build', confirmation: 'CONFIRM DEPLOY' }))).status).toBe(502);
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.fetch.mock.calls[0][0]).toContain('/build-google-migration-images.yml/dispatches');
  });
  it('the Builds page queues a real workflow instead of recording a health probe as deployed', async () => {
    mocks.fetch.mockResolvedValue(new Response(null, { status: 204 }));
    const response = await BUILD_POST(request({ service: 'admin', action: 'build', confirmation: 'CONFIRM DEPLOY' }));
    expect(response.status).toBe(202);
    expect(await response.json()).toMatchObject({ state: 'queued', action: 'build', service: 'admin' });
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.fetch.mock.calls[0][0]).toContain('/build-google-migration-images.yml/dispatches');
  });
  it('rejects unauthorized Builds requests before accessing deployment credentials', async () => {
    mocks.auth.mockResolvedValue({ error: new Response('{}', { status: 403 }) });
    expect((await BUILD_POST(request({ service: 'admin', action: 'build', confirmation: 'CONFIRM DEPLOY' }))).status).toBe(403);
    expect(mocks.secret).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it('rejects unconfirmed Builds requests before dispatching any workflow', async () => {
    expect((await BUILD_POST(request({ service: 'admin', action: 'deploy', image_sha: 'a'.repeat(40) }))).status).toBe(409);
    expect(mocks.secret).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
