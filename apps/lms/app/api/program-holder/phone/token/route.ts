// pre-auth-registry: exempt - requireCommunicationActor verifies the owner before provider-scoped credentials are issued.
import { NextResponse } from 'next/server';
import { phoneActorResponse } from '@/lib/phone/actor-response';
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
  // The PBX provisioner rejects legacy carrier assignments. Return the real
  // migration blocker to the UI instead of a misleading generic 502.
  // Do not change existing extension ownership or telephone routing here.
  if (extension.webrtc_provider !== 'asterisk') {
    return NextResponse.json(
      { error: 'This extension is still assigned to the retired phone provider. An administrator must migrate this extension to Elevate Phone before device registration.' },
      { status: 409 },
    );
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
    // Twilio is the carrier for external PSTN calls. PWA endpoints register
    // against Elevate's independent Asterisk WSS transport, not Telnyx.
    // External dialing must be routed by the verified Twilio PBX trunk.
    const credential = await provisionAsteriskDevice(ctx.db, {
      profileId: ctx.user.id,
      deviceId: asteriskDeviceId(deviceId),
      extensionId: extension.id,
    });
    return NextResponse.json(
      { ...credential, callerId: extension.extension },
      { headers: { 'Cache-Control': 'no-store, private', Pragma: 'no-cache' } },
    );
  } catch (cause) {
    return NextResponse.json(
      { error: 'The phone device could not connect. Please retry or contact the administrator.' },
      { status: 502 },
    );
  }
}
