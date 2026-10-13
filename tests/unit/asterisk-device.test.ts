// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  asteriskDeviceStatus,
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
