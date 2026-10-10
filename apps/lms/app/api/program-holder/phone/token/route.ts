// pre-auth-registry: exempt - requireCommunicationActor verifies the owner before provider-scoped credentials are issued.
import { NextResponse } from 'next/server';
import { phoneActorResponse } from '@/lib/phone/actor-response';
import { ensureDeviceCredential } from '@/lib/phone/webrtc';
import { hydrateProcessEnv } from '@/lib/secrets';
import { provisionAsteriskDevice, asteriskDeviceId } from '@/lib/phone/asterisk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEVICE_ID = /^[A-Za-z0-9_-]{16,100}$/;

export async function POST(request: Request) {
  const { actor: ctx, response: actorError } = await phoneActorResponse();
  if (actorError) return actorError;
  if (ctx.previewing) {
    return NextResponse.json(
      { error: 'Administrator portal previews cannot connect or place calls.' },
      { status: 403 },
    );
  }
  const body = await request.json().catch(() => ({}));
  const deviceId = String(body.deviceId || '');
  if (!DEVICE_ID.test(deviceId)) {
    return NextResponse.json(
      { error: 'A valid PWA device identifier is required.' },
      { status: 400 },
    );
  }
  const { data: extension } = await ctx.db
    .from('communication_extensions')
    .select('*,communication_workspaces!inner(id,phone_system_id)')
    .eq('profile_id', ctx.user.id)
    .eq('enabled', true)
    .maybeSingle();
  if (!extension?.communication_workspaces?.phone_system_id) {
    return NextResponse.json({ error: 'No enabled phone extension is assigned.' }, { status: 404 });
  }
  if (['offline', 'do_not_disturb'].includes(extension.ring_mode)) {
    return NextResponse.json(
      { error: 'Set the phone to Ring, Vibrate, or Silent before connecting.' },
      { status: 409 },
    );
  }
  const { data: system } = await ctx.db
    .from('phone_systems')
    .select('*')
    .eq('id', extension.communication_workspaces.phone_system_id)
    .eq('status', 'active')
    .maybeSingle();
  if (!system)
    return NextResponse.json({ error: 'The phone system is not active.' }, { status: 503 });
  try {
    await hydrateProcessEnv();
    if (extension.webrtc_provider === 'asterisk') {
      const credential = await provisionAsteriskDevice(ctx.db, {
        profileId: ctx.user.id,
        deviceId: asteriskDeviceId(deviceId),
        extensionId: extension.id,
      });
      return NextResponse.json(
        { ...credential, callerId: extension.extension },
        { headers: { 'Cache-Control': 'no-store, private', Pragma: 'no-cache' } },
      );
    }
    const { data: primaryNumber, error: numberError } = await ctx.db
      .from('phone_numbers')
      .select('e164')
      .eq('phone_system_id', system.id)
      .eq('status', 'active')
      .eq('is_primary', true)
      .maybeSingle();
    if (numberError || !primaryNumber?.e164) {
      return NextResponse.json(
        { error: 'The phone system has no active primary caller ID.' },
        { status: 503 },
      );
    }
    const credential = await ensureDeviceCredential({
      db: ctx.db,
      system,
      extension,
      profileId: ctx.user.id,
      deviceId,
      callerId: primaryNumber.e164,
    });
    // A credential is only a permission to connect. The PWA reports presence
    // after Telnyx confirms its socket is ready.
    const { count: otherLiveDevices } = await ctx.db
      .from('phone_webrtc_devices')
      .select('id', { count: 'exact', head: true })
      .eq('extension_id', extension.id)
      .eq('status', 'active')
      .eq('provider', 'telnyx')
      .eq('connection_state', 'connected')
      .neq('device_id', deviceId)
      .gte('last_seen_at', new Date(Date.now() - 120_000).toISOString());
    if (!otherLiveDevices) {
      await ctx.db
        .from('communication_extensions')
        .update({ presence_status: 'offline', updated_at: new Date().toISOString() })
        .eq('id', extension.id)
        .eq('profile_id', ctx.user.id);
    }
    return NextResponse.json(
      {
        provider: 'telnyx',
        token: credential.token,
        sipUsername: credential.sipUsername,
        extension: extension.extension,
        callerId: primaryNumber.e164,
      },
      { headers: { 'Cache-Control': 'no-store, private', Pragma: 'no-cache' } },
    );
  } catch (cause) {
    return NextResponse.json(
      { error: 'The phone device could not connect. Please retry or contact the administrator.' },
      { status: 502 },
    );
  }
}
