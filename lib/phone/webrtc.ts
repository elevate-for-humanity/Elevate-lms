import 'server-only';

import { randomBytes } from 'node:crypto';
import { telnyxClient, publicPhoneNumber } from '@/lib/phone/telnyx';

type DatabaseClient = any;

export async function ensureWebrtcConnection(db: DatabaseClient, system: any) {
  const client = telnyxClient();
  if (system.webrtc_connection_id) {
    try {
      const existing = await client.credentialConnections.retrieve(system.webrtc_connection_id);
      if (existing.data?.id) return existing.data.id;
    } catch {
      // Reconcile a deleted or stale provider identifier below.
    }
  }

  let connectionId = '';
  for await (const connection of client.credentialConnections.list({
    filter: { connection_name: { contains: 'Elevate Program Holder PWA' } },
    'page[size]': 50,
  })) {
    if (connection.id && connection.connection_name === 'Elevate Program Holder PWA') {
      connectionId = connection.id;
      break;
    }
  }

  if (!connectionId) {
    let outboundProfileId = process.env.TELNYX_OUTBOUND_VOICE_PROFILE_ID || '';
    if (!outboundProfileId) {
      for await (const profile of client.outboundVoiceProfiles.list({ 'page[size]': 50 })) {
        if (
          profile.id &&
          profile.enabled !== false &&
          profile.name === 'Elevate Production Voice'
        ) {
          outboundProfileId = profile.id;
          break;
        }
        if (!outboundProfileId && profile.id && profile.enabled !== false)
          outboundProfileId = profile.id;
      }
    }
    const response = await client.credentialConnections.create({
      connection_name: 'Elevate Program Holder PWA',
      user_name: `ElevatePWA${randomBytes(5).toString('hex')}`.slice(0, 30),
      password: randomBytes(32).toString('base64url'),
      active: true,
      sip_uri_calling_preference: 'internal',
      inbound: { simultaneous_ringing: 'enabled' },
      outbound: {
        ani_override: publicPhoneNumber(),
        ani_override_type: 'always',
        call_parking_enabled: false,
        ...(outboundProfileId ? { outbound_voice_profile_id: outboundProfileId } : {}),
      },
    });
    connectionId = response.data?.id || '';
  }

  if (!connectionId) throw new Error('Telnyx did not return a WebRTC connection identifier.');
  const { error } = await db
    .from('phone_systems')
    .update({
      webrtc_connection_id: connectionId,
      webrtc_connection_status: 'configured',
      updated_at: new Date().toISOString(),
    })
    .eq('id', system.id);
  if (error) throw new Error('The WebRTC connection could not be saved.');
  return connectionId;
}

export async function ensureDeviceCredential(input: {
  db: DatabaseClient;
  system: any;
  extension: any;
  profileId: string;
  deviceId: string;
}) {
  const { db, system, extension, profileId, deviceId } = input;
  const client = telnyxClient();
  const { data: stored } = await db
    .from('phone_webrtc_devices')
    .select('*')
    .eq('profile_id', profileId)
    .eq('device_id', deviceId)
    .eq('status', 'active')
    .maybeSingle();

  let credentialId = stored?.provider_credential_id || '';
  let sipUsername = stored?.sip_username || '';
  if (credentialId) {
    try {
      const existing = await client.telephonyCredentials.retrieve(credentialId);
      if (existing.data?.expired) credentialId = '';
      else sipUsername = existing.data?.sip_username || sipUsername;
    } catch {
      credentialId = '';
    }
  }

  if (!credentialId) {
    const connectionId = await ensureWebrtcConnection(db, system);
    const response = await client.telephonyCredentials.create({
      connection_id: connectionId,
      name: `Extension ${extension.extension} device ${deviceId.slice(0, 8)}`,
      tag: `program-holder-${profileId}`,
      expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    });
    credentialId = response.data?.id || '';
    sipUsername = response.data?.sip_username || '';
    if (!credentialId || !sipUsername) {
      throw new Error('Telnyx did not return a complete device credential.');
    }
  }

  const now = new Date().toISOString();
  const { error } = await db.from('phone_webrtc_devices').upsert(
    {
      extension_id: extension.id,
      profile_id: profileId,
      device_id: deviceId,
      provider_credential_id: credentialId,
      sip_username: sipUsername,
      status: 'active',
      last_seen_at: now,
      updated_at: now,
    },
    { onConflict: 'profile_id,device_id' },
  );
  if (error) throw new Error('The phone device could not be registered.');

  const token = await client.telephonyCredentials.createToken(credentialId);
  return { credentialId, sipUsername, token };
}
