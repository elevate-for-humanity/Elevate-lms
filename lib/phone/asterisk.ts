import 'server-only';

import { createHmac } from 'node:crypto';

export type DeviceIdentity = { profileId: string; deviceId: string; extensionId: string };
type AsteriskCredential = {
  provider: 'asterisk';
  endpointId: string;
  sipUsername: string;
  sipPassword: string;
  sipDomain: string;
  wsUrl: string;
  extensionId: string;
  extension: string;
};
export type AsteriskRegistration = {
  provider: 'asterisk';
  registered: boolean;
  connectionState: 'connected' | 'disconnected';
  contactCount: number;
  reachableContactCount: number;
  observedAt: string;
};

// Only the server may call this control plane. The browser receives its own SIP
// credential, never the provisioning token or the Supabase service credential.
async function controlRequest<T>(path: string, identity: DeviceIdentity): Promise<T> {
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.ELEVATE_RUNTIME_CONFIG_PROVIDER !== 'google-secret-manager'
  ) {
    throw new Error(
      'The independent phone service requires Google Secret Manager runtime bindings.',
    );
  }
  const base = new URL(process.env.PBX_CONTROL_URL || 'https://phone.elevateforhumanity.org');
  const token = process.env.PBX_PROVISIONING_TOKEN || '';
  if (base.protocol !== 'https:' || base.username || base.password || token.length < 32) {
    throw new Error('The independent phone provisioning service is not configured.');
  }
  const response = await fetch(new URL(`/internal/pbx/devices${path}`, base), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(identity),
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok)
    throw new Error('The independent phone provisioning service could not verify this device.');
  return response.json();
}

export function deviceIceServers(endpointId: string, now = Date.now()): RTCIceServer[] {
  const servers: RTCIceServer[] = [];
  const stun = (process.env.PBX_STUN_URLS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  if (stun.some((url) => !/^stuns?:[^\s]+$/.test(url)))
    throw new Error('The phone STUN configuration is invalid.');
  if (stun.length) servers.push({ urls: stun });
  const turn = (process.env.PBX_TURN_URLS || '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
  if (turn.length) {
    const secret = process.env.PBX_TURN_SHARED_SECRET || '';
    if (secret.length < 32 || turn.some((url) => !/^turns?:[^\s]+$/.test(url))) {
      throw new Error('The phone TURN configuration is incomplete.');
    }
    // Coturn REST credentials are scoped to this endpoint and expire in an hour.
    const username = `${Math.floor(now / 1000) + 3600}:${endpointId}`;
    servers.push({
      urls: turn,
      username,
      credential: createHmac('sha1', secret).update(username).digest('base64'),
    });
  }
  return servers;
}

export function asteriskDeviceId(deviceId: string) {
  return `asterisk_${deviceId}`;
}

export async function provisionAsteriskDevice(db: any, identity: DeviceIdentity) {
  const credential = await controlRequest<AsteriskCredential>('', identity);
  const ws = new URL(credential.wsUrl);
  if (
    credential.provider !== 'asterisk' ||
    credential.extensionId !== identity.extensionId ||
    !/^pwa-[a-f0-9]{32,64}$/.test(credential.endpointId) ||
    credential.sipUsername !== credential.endpointId ||
    credential.sipDomain !== 'phone.elevateforhumanity.org' ||
    !/^[A-Za-z0-9_-]{32,128}$/.test(credential.sipPassword) ||
    !/^[a-z0-9.-]+$/i.test(credential.sipDomain) ||
    ws.protocol !== 'wss:' ||
    ws.hostname !== credential.sipDomain ||
    ws.username ||
    ws.password ||
    ws.pathname !== '/ws' ||
    ws.search ||
    ws.hash
  )
    throw new Error('The independent phone service returned an invalid device credential.');
  const iceServers = deviceIceServers(credential.endpointId);
  const { error } = await db.from('phone_webrtc_devices').upsert(
    {
      extension_id: identity.extensionId,
      profile_id: identity.profileId,
      device_id: identity.deviceId,
      provider: 'asterisk',
      provider_credential_id: credential.endpointId,
      sip_username: credential.sipUsername,
      status: 'active',
      registration_state: 'unregistered',
      connection_state: 'disconnected',
      last_seen_at: null,
      registration_verified_at: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'profile_id,device_id' },
  );
  if (error) throw new Error('The independent phone device could not be saved.');
  return { ...credential, iceServers };
}

export async function asteriskDeviceStatus(
  identity: DeviceIdentity,
): Promise<AsteriskRegistration> {
  const result = await controlRequest<AsteriskRegistration>('/status', identity);
  const age = Date.now() - Date.parse(result.observedAt);
  if (result.provider !== 'asterisk' || !Number.isFinite(age) || age < -5_000 || age > 30_000) {
    throw new Error('The independent phone registration evidence is not current.');
  }
  return {
    ...result,
    registered: result.registered === true && result.contactCount > 0,
    connectionState:
      result.registered === true &&
      result.reachableContactCount > 0 &&
      result.connectionState === 'connected'
        ? 'connected'
        : 'disconnected',
  };
}

export async function revokeAsteriskDevice(identity: DeviceIdentity) {
  await controlRequest('/revoke', identity);
}
