// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ actor: vi.fn(), hydrate: vi.fn() }));
vi.mock('@/lib/phone/actor-response', () => ({ phoneActorResponse: state.actor }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: state.hydrate }));
import { POST } from '@/apps/lms/app/api/program-holder/phone/token/route';
const extension = {
  id: '22222222-2222-4222-8222-222222222222',
  webrtc_provider: 'asterisk',
  ring_mode: 'ring',
  extension: '0',
  communication_workspaces: { phone_system_id: 'system' },
};
let upsert: ReturnType<typeof vi.fn>;
beforeEach(() => {
  vi.stubEnv('PBX_RUNTIME_CONFIG_PROVIDER', 'google-secret-manager');
  vi.stubEnv('PBX_PROVISIONING_TOKEN', 'test-token-'.repeat(5));
  vi.stubEnv('PBX_CONTROL_URL', 'https://phone.elevateforhumanity.org');
  state.hydrate.mockResolvedValue(undefined);
  upsert = vi.fn().mockResolvedValue({ error: null });
  state.actor.mockResolvedValue({
    actor: {
      user: { id: '11111111-1111-4111-8111-111111111111' },
      previewing: false,
      db: {
        from: (table: string) => {
          const chain = {
            select: () => chain,
            eq: () => chain,
            maybeSingle: async () => ({
              data:
                table === 'communication_extensions'
                  ? extension
                  : { id: 'system', status: 'active' },
            }),
            upsert,
          };
          return chain;
        },
      },
    },
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const request = () =>
  new Request('https://admin.example/api/program-holder/phone/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId: 'isolated-owner-device-0001' }),
  });
it('rejects expired sessions before fetching or provisioning any device', async () => {
  state.actor.mockResolvedValue({
    response: Response.json({ error: 'AUTH_REQUIRED' }, { status: 401 }),
  });
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  expect((await POST(request())).status).toBe(401);
  expect(fetcher).not.toHaveBeenCalled();
  expect(upsert).not.toHaveBeenCalled();
});
it.each([
  [401, 'PHONE_CONTROL_AUTH_FAILED'],
  [503, 'PHONE_PROVISIONER_UNAVAILABLE'],
])(
  'returns safe diagnostics for control-plane HTTP %s without credentials',
  async (status, code) => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ error: 'private-provider-detail' }, { status })),
    );
    const result = await POST(request());
    const body = await result.json();
    expect(result.status).toBe(502);
    expect(body.code).toBe(code);
    expect(result.headers.get('cache-control')).toBe('no-store, private');
    expect(JSON.stringify(body)).not.toMatch(/test-token|private-provider-detail/);
    expect(upsert).not.toHaveBeenCalled();
  },
);
it('distinguishes missing production bindings before a network call', async () => {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('PBX_RUNTIME_CONFIG_PROVIDER', '');
  vi.stubEnv('ELEVATE_RUNTIME_CONFIG_PROVIDER', '');
  const fetcher = vi.fn();
  vi.stubGlobal('fetch', fetcher);
  const result = await POST(request());
  expect((await result.json()).code).toBe('PHONE_RUNTIME_BINDINGS_MISSING');
  expect(fetcher).not.toHaveBeenCalled();
});
