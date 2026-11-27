// pre-auth-registry: exempt - authenticated private PBX ingestion; constant-time server token and configured phone-system scope.
import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PushNotificationService } from '@/lib/notifications/push-service';
import { sendCallWakePush } from '@/lib/phone/call-wake';
import { usesGooglePhoneBindings } from '@/lib/phone/runtime-authority';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Only fixed diagnostic classes cross the response/log boundary. Never log
// callers, credentials, or provider bodies.
const SAFE_CALL_WAKE_FAILURES = new Set([
  'system_lookup_unavailable',
  'workspace_lookup_unavailable',
  'extension_lookup_unavailable',
  'call_wake_presence_unavailable',
]);
const push = new PushNotificationService();

async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw Error('missing_body');
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.byteLength;
      if (size > 16 * 1024) throw Error('body_too_large');
      chunks.push(next.value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

/**
 * Call-wake trigger: the PBX posts here the moment an inbound call is routed
 * to a PWA extension. If the extension's owner has no live registered device,
 * they get a Web Push that buzzes their phone and opens the phone page in
 * wake mode. Best-effort by contract: alerting outcomes are reported in the
 * response body, never as call-handling failures, and a wake problem must
 * never give the PBX a reason to retry or delay the call.
 */
export async function POST(request: Request) {
  try {
    await hydrateProcessEnv();
    const expected = process.env.PBX_PROVISIONING_TOKEN || '';
    const given = request.headers.get('authorization')?.replace(/^Bearer /, '') || '';
    if (
      expected.length < 32 ||
      given.length !== expected.length ||
      !timingSafeEqual(Buffer.from(given), Buffer.from(expected))
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!usesGooglePhoneBindings() || !UUID.test(process.env.PBX_PHONE_SYSTEM_ID || '')) {
      return NextResponse.json({ error: 'Call wake is not configured.' }, { status: 503 });
    }
    const body = await readBody(request);
    const callerName =
      typeof body.callerName === 'string' ? Array.from(body.callerName as string, (c: string) => (c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127 ? ' ' : c)).join('').trim() : '';
    if (
      !UUID.test(body.id || '') ||
      !/^(0|[1-9][0-9]{2})$/.test(body.extension || '') ||
      typeof body.caller !== 'string' ||
      !/^(unknown|[0-9]{1,3}|[+][1-9][0-9]{7,14})$/.test(body.caller) ||
      callerName.length > 80
    ) {
      return NextResponse.json({ error: 'Invalid call alert.' }, { status: 400 });
    }
    const createdAt = new Date(body.createdAt);
    if (!Number.isFinite(createdAt.getTime()) || createdAt.getTime() > Date.now() + 60000) {
      return NextResponse.json({ error: 'Invalid call alert timing.' }, { status: 400 });
    }
    // A wake for a call that started over a minute ago can no longer be
    // answered; acknowledge without alerting so the PBX never retries.
    if (Date.now() - createdAt.getTime() > 60000) {
      return NextResponse.json({ alerted: false, reason: 'stale' });
    }
    const db = await requireAdminClient();
    const systemId = process.env.PBX_PHONE_SYSTEM_ID!;
    const { data: system, error: systemError } = await db
      .from('phone_systems')
      .select('id,status,admin_extension')
      .eq('id', systemId)
      .maybeSingle();
    if (systemError) throw Error('system_lookup_unavailable');
    if (!system || system.status !== 'active') {
      return NextResponse.json({ error: 'Phone system is not active.' }, { status: 409 });
    }
    const { data: workspace, error: workspaceError } = await db
      .from('communication_workspaces')
      .select('id')
      .eq('phone_system_id', systemId)
      .maybeSingle();
    if (workspaceError || !workspace) throw Error('workspace_lookup_unavailable');
    // The operator destination '0' is the configured admin extension's row,
    // the same resolution the missed-call notifier uses.
    const dialedExtension = body.extension === '0' ? system.admin_extension || '0' : body.extension;
    const { data: extension, error: extensionError } = await db
      .from('communication_extensions')
      .select('id,profile_id,ring_mode')
      .eq('workspace_id', workspace.id)
      .eq('extension', dialedExtension)
      .eq('enabled', true)
      .maybeSingle();
    if (extensionError) throw Error('extension_lookup_unavailable');
    if (!extension?.profile_id) {
      return NextResponse.json({ alerted: false, reason: 'no_recipient' });
    }
    const result = await sendCallWakePush(
      db,
      extension,
      { callId: body.id, extension: dialedExtension, caller: body.caller, callerName: callerName || null },
      (profileId, notification) => push.sendToUserWithDatabase(db, profileId, notification),
    );
    return NextResponse.json({
      alerted: result.sent,
      reason: result.reason,
      ...(result.acceptedDeviceCount
        ? { acceptedDeviceCount: result.acceptedDeviceCount }
        : {}),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : '';
    const reason = SAFE_CALL_WAKE_FAILURES.has(msg) ? msg : 'unexpected_failure';
    console.error('phone_call_wake_failed', { reason, error: msg });
    return NextResponse.json(
      { error: 'Call wake is unavailable.', code: 'call_wake_unavailable' },
      { status: 503 },
    );
  }
}
