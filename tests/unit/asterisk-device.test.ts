// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  asteriskDeviceStatus,
  phoneConnectionFailure,
  deviceIceServers,
  provisionAsteriskDevice,
} from '@/lib/phone/asterisk';

const identity = {
  profileId: '11111111-1111-4111-8111-111111111111',
  extensionId: '22222222-2222-4222-8222-222222222222',
  deviceId: 'test-device-00000001',
};
const credential = {
  provider: 'asterisk',
  endpointId: `pwa-${'a'.repeat(40)}`,
  sipUsername: `pwa-${'a'.repeat(40)}`,
  sipPassword: 's'.repeat(43),
  sipDomain: 'phone.elevateforhumanity.org',
  wsUrl: 'wss://phone.elevateforhumanity.org/ws',
  extensionId: identity.extensionId,
  extension: '101',
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function setup() {
  vi.stubEnv('PBX_PROVISIONING_TOKEN', 't'.repeat(48));
  vi.stubEnv('PBX_CONTROL_URL', 'https://phone.elevateforhumanity.org');
  vi.stubEnv('PBX_STUN_URLS', '');
  vi.stubEnv('PBX_TURN_URLS', '');
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const db = { from: vi.fn().mockReturnValue({ upsert }) };
  return { db, upsert };
}

describe('independent phone credential boundary', () => {
  it('persists only provider identifiers and keeps a provisioned device offline', async () => {
    const { db, upsert } = setup();
    const request = vi.fn().mockResolvedValue({ ok: true, json: async () => credential });
    vi.stubGlobal('fetch', request);
    const result = await provisionAsteriskDevice(db, identity);
    expect(result.sipPassword).toBe(credential.sipPassword);
    const [record, options] = upsert.mock.calls[0];
    expect(record).toMatchObject({
      provider: 'asterisk',
      connection_state: 'disconnected',
      registration_state: 'unregistered',
      registration_verified_at: null,
      last_seen_at: null,
    });
    expect(JSON.stringify(record)).not.toContain(credential.sipPassword);
    expect(options.onConflict).toBe('profile_id,device_id');
    expect(request.mock.calls[0][1]).toMatchObject({ redirect: 'error', cache: 'no-store' });
  });

  it('rejects another extension credential and never persists it', async () => {
    const { db, upsert } = setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ ...credential, extensionId: 'wrong' }),
      }),
    );
    await expect(provisionAsteriskDevice(db, identity)).rejects.toThrow(
      'invalid device credential',
    );
    expect(upsert).not.toHaveBeenCalled();
  });

  it('requires trusted TLS before sending the provisioning token', async () => {
    const { db } = setup();
    vi.stubEnv('PBX_CONTROL_URL', 'http://phone.elevateforhumanity.org');
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    await expect(provisionAsteriskDevice(db, identity)).rejects.toThrow('not configured');
    expect(request).not.toHaveBeenCalled();
  });

  it('treats an unqualified registration as disconnected and rejects stale evidence', async () => {
    setup();
    const status = {
      provider: 'asterisk',
      registered: true,
      contactCount: 1,
      reachableContactCount: 0,
      connectionState: 'connected',
      observedAt: new Date().toISOString(),
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => status }));
    expect((await asteriskDeviceStatus(identity)).connectionState).toBe('disconnected');
    status.observedAt = new Date(Date.now() - 60_000).toISOString();
    await expect(asteriskDeviceStatus(identity)).rejects.toThrow('not current');
  });

  it('issues bounded endpoint-specific TURN credentials without returning the shared secret', () => {
    setup();
    vi.stubEnv('PBX_TURN_URLS', 'turns:turn.example.org:5349');
    vi.stubEnv('PBX_TURN_SHARED_SECRET', 'x'.repeat(48));
    const servers = deviceIceServers(credential.endpointId, 1_000_000);
    expect(servers[0].username).toBe(`4600:${credential.endpointId}`);
    expect(JSON.stringify(servers)).not.toContain('x'.repeat(48));
    expect(servers[0].credential).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });
});

it('requires explicit Google authority for production phone credentials', async () => {
  const { db } = setup();
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('ELEVATE_RUNTIME_CONFIG_PROVIDER', '');
  vi.stubEnv('PBX_RUNTIME_CONFIG_PROVIDER', '');
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => credential }));
  await expect(provisionAsteriskDevice(db, identity)).rejects.toThrow('Google Secret Manager');
  vi.stubEnv('PBX_RUNTIME_CONFIG_PROVIDER', 'google-secret-manager');
  expect((await provisionAsteriskDevice(db, identity)).provider).toBe('asterisk');
});

describe('phone connection failure isolation', () => {
  it.each([
    [401, 'unauthorized', 'PHONE_CONTROL_AUTH_FAILED'],
    [403, 'device_not_authorized', 'PHONE_DEVICE_NOT_AUTHORIZED'],
    [503, 'provisioner_quarantined', 'PHONE_PROVISIONER_UNAVAILABLE'],
    [409, 'device_limit_reached', 'PHONE_DEVICE_LIMIT_REACHED'],
    [409, 'device_assignment_conflict', 'PHONE_DEVICE_ASSIGNMENT_CONFLICT'],
    [409, 'secret-credential-and-internal-host', 'PHONE_CONTROL_REJECTED'],
    [400, 'secret-credential-and-internal-host', 'PHONE_CONTROL_REJECTED'],
  ])('classifies HTTP %s without reflecting provider data', async (status, error, code) => {
    const { db, upsert } = setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error }, { status })));
    const cause = await provisionAsteriskDevice(db, identity).catch((error) => error);
    const failure = phoneConnectionFailure(cause);
    expect(failure.code).toBe(code);
    expect(JSON.stringify(failure)).not.toContain('secret-credential-and-internal-host');
    expect(upsert).not.toHaveBeenCalled();
  });

  it('identifies missing authoritative runtime bindings before contacting any service', async () => {
    const { db } = setup();
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PBX_RUNTIME_CONFIG_PROVIDER', '');
    vi.stubEnv('ELEVATE_RUNTIME_CONFIG_PROVIDER', '');
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const failure = phoneConnectionFailure(
      await provisionAsteriskDevice(db, identity).catch((error) => error),
    );
    expect(failure.code).toBe('PHONE_RUNTIME_BINDINGS_MISSING');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([
    [new DOMException('private timeout content', 'TimeoutError'), 'PHONE_CONTROL_TIMEOUT'],
    [new Error('private transport content'), 'PHONE_CONTROL_UNREACHABLE'],
  ])('classifies transport failures without leaking exceptions', async (cause, code) => {
    const { db } = setup();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(cause));
    const failure = phoneConnectionFailure(
      await provisionAsteriskDevice(db, identity).catch((error) => error),
    );
    expect(failure.code).toBe(code);
    expect(JSON.stringify(failure)).not.toContain('private');
  });

  it('redacts arbitrary unknown exceptions', () => {
    expect(phoneConnectionFailure(new Error('credential-secret'))).toMatchObject({
      code: 'PHONE_CONTROL_REJECTED',
    });
    expect(JSON.stringify(phoneConnectionFailure(new Error('credential-secret')))).not.toContain(
      'credential-secret',
    );
  });
});
