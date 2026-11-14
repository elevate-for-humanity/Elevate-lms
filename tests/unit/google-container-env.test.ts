import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), rate: vi.fn(), secret: vi.fn(), save: vi.fn(), inventory: vi.fn() }));
vi.mock('next/server', () => ({ NextResponse: { json: (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), init) } }));
vi.mock('@/lib/devstudio/api-auth', () => ({ apiRequireDevStudio: mocks.auth }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: mocks.rate }));
vi.mock('@/lib/secrets', () => ({ getDecryptedPlatformSecret: mocks.secret }));
vi.mock('@/lib/google/runtime-configuration', () => ({
  saveGoogleRuntimeConfiguration: mocks.save, getGoogleRuntimeConfiguration: mocks.inventory,
  runtimeComponent: (value: string) => { if (!['admin','lms','marketing','store'].includes(value)) throw new Error('Unsupported service'); return value; },
  GoogleConfigurationError: class extends Error {},
}));
vi.mock('@/lib/api/safe-error', () => ({ safeError: (error: string, status: number) => new Response(JSON.stringify({error}), {status}), safeInternalError: () => new Response('{}', {status:503}) }));
import { GET, POST } from '@/apps/admin/app/api/admin/dev-studio/container-env/route';
const req = (body: unknown = {}) => ({ url: 'https://admin.example/api/admin/dev-studio/container-env', json: async () => body }) as any;
describe('Google Studio runtime settings', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.auth.mockResolvedValue({id:'admin'}); mocks.rate.mockResolvedValue(null); });
  it('rejects unauthorized reads and writes before accessing credentials or Google', async () => {
    mocks.auth.mockResolvedValue({error:new Response('{}',{status:403})});
    expect((await GET(req())).status).toBe(403); expect((await POST(req())).status).toBe(403);
    expect(mocks.secret).not.toHaveBeenCalled(); expect(mocks.save).not.toHaveBeenCalled(); expect(mocks.inventory).not.toHaveBeenCalled();
  });
  it('updates exactly the selected Google service without returning the credential', async () => {
    mocks.save.mockResolvedValue({runtimeSynced:true,revision:'verified-revision'});
    const response = await POST(req({key:'ELEVATE_MEDIA_BUCKET',value:'private-value',service:'lms'}));
    expect(mocks.save).toHaveBeenCalledWith('lms',[{key:'ELEVATE_MEDIA_BUCKET',value:'private-value'}]);
    const text = await response.text(); expect(text).not.toContain('private-value'); expect(JSON.parse(text).updatedServices).toEqual(['lms']);
  });
  it('does not report success when Google verification fails', async () => {
    mocks.secret.mockResolvedValue('private-value'); mocks.save.mockRejectedValue(new Error('Google failed'));
    const response = await POST(req({key:'XAI_API_KEY'}));
    expect(response.status).toBe(503); expect(await response.text()).not.toContain('private-value');
  });
});
