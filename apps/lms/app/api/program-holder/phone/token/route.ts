// pre-auth-registry: exempt - requireProgramHolder verifies the holder before a scoped Telnyx token is minted.
import { NextResponse } from 'next/server';
import { requireCommunicationActor } from '@/lib/communications/actor';
import { publicPhoneNumber } from '@/lib/phone/telnyx';
import { ensureDeviceCredential } from '@/lib/phone/webrtc';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEVICE_ID = /^[A-Za-z0-9_-]{16,100}$/;

export async function POST(request: Request) {
  const ctx = await requireCommunicationActor();
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
    const credential = await ensureDeviceCredential({
      db: ctx.db,
      system,
      extension,
      profileId: ctx.user.id,
      deviceId,
    });
    await ctx.db
      .from('communication_extensions')
      .update({
        presence_status: extension.ring_mode === 'do_not_disturb' ? 'do_not_disturb' : 'available',
        last_presence_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', extension.id)
      .eq('profile_id', ctx.user.id);
    return NextResponse.json({
      token: credential.token,
      sipUsername: credential.sipUsername,
      extension: extension.extension,
      callerId: publicPhoneNumber(),
    });
  } catch (cause) {
    console.error('WebRTC credential provisioning failed:', cause);
    return NextResponse.json(
      { error: cause instanceof Error ? cause.message : 'The phone device could not connect.' },
      { status: 502 },
    );
  }
}
