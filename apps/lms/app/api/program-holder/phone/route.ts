// pre-auth-registry: exempt - requireProgramHolder verifies the authenticated holder and every query is profile-scoped.
import { NextResponse } from 'next/server';
import { requireCommunicationActor } from '@/lib/communications/actor';
import { asteriskDeviceStatus, asteriskDeviceId } from '@/lib/phone/asterisk';
import { hydrateProcessEnv } from '@/lib/secrets';
import {
  DEFAULT_AVAILABILITY_SCHEDULE,
  type AvailabilitySchedule,
  type AvailabilitySource,
  type RingMode,
} from '@/lib/phone/availability';

export const dynamic = 'force-dynamic';

const RING_MODES = new Set<RingMode>(['ring', 'vibrate', 'silent', 'do_not_disturb', 'offline']);
const AVAILABILITY_SOURCES = new Set<AvailabilitySource>(['manual', 'schedule']);
const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DEVICE_ID = /^[A-Za-z0-9_-]{16,100}$/;

async function phoneContext() {
  const ctx = await requireCommunicationActor();
  const { data: extension } = await ctx.db
    .from('communication_extensions')
    .select('*,communication_workspaces!inner(id,phone_system_id)')
    .eq('profile_id', ctx.user.id)
    .eq('enabled', true)
    .maybeSingle();
  const systemId = extension?.communication_workspaces?.phone_system_id;
  const [{ data: system }, { data: primaryNumber }] = systemId
    ? await Promise.all([
        ctx.db
          .from('phone_systems')
          .select('id,name,timezone,status')
          .eq('id', systemId)
          .maybeSingle(),
        ctx.db
          .from('phone_numbers')
          .select('e164')
          .eq('phone_system_id', systemId)
          .eq('status', 'active')
          .eq('is_primary', true)
          .maybeSingle(),
      ])
    : [{ data: null }, { data: null }];
  return {
    ctx,
    extension,
    system,
    phoneNumber: primaryNumber?.e164 || process.env.TELNYX_PHONE_NUMBER?.trim() || '',
  };
}

function safeSchedule(value: unknown): AvailabilitySchedule | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const schedule: AvailabilitySchedule = {};
  for (const day of DAY_KEYS) {
    const window = (value as Record<string, unknown>)[day];
    if (window == null) continue;
    if (
      !Array.isArray(window) ||
      window.length !== 2 ||
      !TIME.test(String(window[0])) ||
      !TIME.test(String(window[1])) ||
      String(window[0]) >= String(window[1])
    ) {
      return null;
    }
    schedule[day] = [String(window[0]), String(window[1])];
  }
  return schedule;
}

export async function GET() {
  const { ctx, extension, system, phoneNumber } = await phoneContext();
  if (!extension || !system || !phoneNumber) {
    return NextResponse.json(
      { error: 'An administrator has not assigned a phone extension to this account.' },
      { status: 404 },
    );
  }
  const [
    { data: inbox, error: inboxError },
    { data: voicemails, error: voicemailError },
    { data: notificationPreferences, error: preferencesError },
    { count: liveDevices },
  ] = await Promise.all([
    ctx.db
      .from('phone_callback_tasks')
      .select(
        'id,source,caller_name,callback_number,reason,program_or_department,urgency,preferred_callback_time,transcript,summary,status,read_at,created_at,recording_url',
      )
      .eq('assigned_profile_id', ctx.user.id)
      .order('created_at', { ascending: false })
      .limit(100),
    ctx.db
      .from('voicemails')
      .select(
        'id,call_id,phone_number,duration_seconds,is_read,status,transcription,summary,created_at,recording_url',
      )
      .eq('assigned_profile_id', ctx.user.id)
      .order('created_at', { ascending: false })
      .limit(100),
    ctx.db
      .from('notification_preferences')
      .select('email_missed_calls,sms_missed_calls,sms_phone')
      .eq('user_id', ctx.user.id)
      .maybeSingle(),
    ctx.db
      .from('phone_webrtc_devices')
      .select('id', { count: 'exact', head: true })
      .eq('extension_id', extension.id)
      .eq('status', 'active')
      .eq('provider', extension.webrtc_provider || 'telnyx')
      .eq('connection_state', 'connected')
      .gte('last_seen_at', new Date(Date.now() - 120_000).toISOString()),
  ]);
  // The phone itself must remain usable if callback history or notification
  // preferences are temporarily unavailable. Those are secondary features.
  const warnings: string[] = [];
  if (inboxError) {
    console.error('[program-holder/phone] callback inbox query failed', inboxError);
    warnings.push('Callback history is temporarily unavailable.');
  }
  if (voicemailError) {
    console.error('[program-holder/phone] voicemail inbox query failed', voicemailError);
    warnings.push('Voicemail history is temporarily unavailable.');
  }
  if (preferencesError) {
    console.error('[program-holder/phone] notification preferences query failed', preferencesError);
    warnings.push('Notification preferences are temporarily unavailable.');
  }
  return NextResponse.json({
    readOnly: ctx.previewing,
    warnings,
    phoneNumber,
    system: { name: system.name, timezone: system.timezone, status: system.status },
    notifications: {
      emailMissedCalls: notificationPreferences?.email_missed_calls !== false,
      smsMissedCalls: notificationPreferences?.sms_missed_calls === true,
      smsPhone: notificationPreferences?.sms_phone || '',
    },
    extension: {
      id: extension.id,
      extension: extension.extension,
      displayName: extension.display_name,
      department: extension.department,
      ringMode: extension.ring_mode,
      availabilitySource: extension.availability_source,
      schedule: extension.availability_schedule || DEFAULT_AVAILABILITY_SCHEDULE,
      ringSeconds: extension.ring_seconds,
      voicemailGreeting: extension.voicemail_greeting || '',
      externalFallbackEnabled: extension.admin_external_fallback === true,
      externalFallbackNumber: extension.external_fallback_number || '',
      presenceStatus: (liveDevices ?? 0) > 0 ? extension.presence_status : 'offline',
      provider: extension.webrtc_provider || 'telnyx',
    },
    voicemail: {
      unreadCount: (voicemails || []).filter((item: any) => !item.is_read).length,
      items: (voicemails || []).map((item: any) => ({
        ...item,
        hasRecording: Boolean(item.recording_url),
        recording_url: undefined,
        recordingUrl: item.recording_url
          ? `/api/program-holder/phone/voicemail/${item.id}/recording`
          : null,
      })),
    },
    inbox: (inbox || []).map((item: any) => ({
      ...item,
      hasRecording: Boolean(item.recording_url),
      recording_url: undefined,
      recordingUrl: item.recording_url
        ? `/api/program-holder/phone/inbox/${item.id}/recording`
        : null,
    })),
  });
}

export async function PATCH(request: Request) {
  const { ctx, extension } = await phoneContext();
  if (ctx.previewing) {
    return NextResponse.json(
      {
        error:
          'Administrator portal previews are read-only. Sign in as the Program Holder to change phone settings.',
      },
      { status: 403 },
    );
  }
  const phoneSettingsRoles = [
    'super_admin',
    'admin',
    'org_admin',
    'staff',
    'instructor',
    'case_manager',
    'counselor',
    'advisor',
    'program_holder',
    'programholder',
    'site_coordinator',
    'host_shop',
    'host_shop_admin',
    'hostshop',
    'partner',
    'employer',
  ];
  if (!ctx.roles.some((role) => phoneSettingsRoles.includes(role))) {
    return NextResponse.json(
      { error: 'An assigned communications account is required.' },
      { status: 403 },
    );
  }
  if (!extension) {
    return NextResponse.json({ error: 'No phone extension is assigned.' }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const provider = extension.webrtc_provider || 'telnyx';
  if (body.action === 'heartbeat') {
    const requestedDeviceId = String(body.deviceId || '');
    const deviceId =
      provider === 'asterisk' ? asteriskDeviceId(requestedDeviceId) : requestedDeviceId;
    if (!DEVICE_ID.test(requestedDeviceId)) {
      return NextResponse.json(
        { error: 'A valid PWA device identifier is required.' },
        { status: 400 },
      );
    }
    const { data: registeredDevice, error: deviceError } = await ctx.db
      .from('phone_webrtc_devices')
      .select('id')
      .eq('profile_id', ctx.user.id)
      .eq('extension_id', extension.id)
      .eq('device_id', deviceId)
      .eq('provider', provider)
      .eq('status', 'active')
      .maybeSingle();
    if (deviceError || !registeredDevice) {
      return NextResponse.json(
        { error: 'Connect this PWA phone before reporting availability.' },
        { status: 409 },
      );
    }
    let verifiedAt = new Date().toISOString();
    if (provider === 'asterisk') {
      try {
        await hydrateProcessEnv();
        const evidence = await asteriskDeviceStatus({
          profileId: ctx.user.id,
          extensionId: extension.id,
          deviceId,
        });
        if (!evidence.registered || evidence.connectionState !== 'connected') {
          const { error: statusError } = await ctx.db
            .from('phone_webrtc_devices')
            .update({
              registration_state: evidence.registered ? 'registered' : 'unregistered',
              connection_state: 'disconnected',
              registration_verified_at: evidence.observedAt,
              updated_at: new Date().toISOString(),
            })
            .eq('id', registeredDevice.id);
          return NextResponse.json(
            {
              error: statusError
                ? 'Registration evidence could not be saved.'
                : 'The SIP registration is not currently reachable.',
            },
            { status: statusError ? 500 : 409 },
          );
        }
        verifiedAt = evidence.observedAt;
      } catch {
        await ctx.db
          .from('phone_webrtc_devices')
          .update({
            registration_state: 'unregistered',
            connection_state: 'disconnected',
            registration_verified_at: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', registeredDevice.id);
        return NextResponse.json(
          { error: 'Asterisk has not confirmed a reachable SIP registration.' },
          { status: 409 },
        );
      }
    }
    patch.last_presence_at = verifiedAt;
    patch.presence_status = ['do_not_disturb', 'offline'].includes(extension.ring_mode)
      ? extension.ring_mode
      : body.inCall === true
        ? 'busy'
        : 'available';
    const { error: heartbeatError } = await ctx.db
      .from('phone_webrtc_devices')
      .update({
        last_seen_at: verifiedAt,
        registration_state: 'registered',
        connection_state: 'connected',
        registration_verified_at: verifiedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('profile_id', ctx.user.id)
      .eq('device_id', deviceId)
      .eq('provider', provider)
      .eq('status', 'active');
    if (heartbeatError)
      return NextResponse.json(
        { error: 'The device heartbeat could not be saved.' },
        { status: 500 },
      );
  } else if (body.action === 'disconnect') {
    const requestedDeviceId = String(body.deviceId || '');
    const deviceId =
      provider === 'asterisk' ? asteriskDeviceId(requestedDeviceId) : requestedDeviceId;
    if (!DEVICE_ID.test(requestedDeviceId)) {
      return NextResponse.json(
        { error: 'A valid PWA device identifier is required.' },
        { status: 400 },
      );
    }
    const { error: disconnectError } = await ctx.db
      .from('phone_webrtc_devices')
      .update({
        registration_state: 'unregistered',
        connection_state: 'disconnected',
        registration_verified_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('profile_id', ctx.user.id)
      .eq('device_id', deviceId)
      .eq('provider', provider)
      .eq('status', 'active');
    if (disconnectError)
      return NextResponse.json(
        { error: 'The device disconnection could not be saved.' },
        { status: 500 },
      );
    const { count: otherOnlineDevices } = await ctx.db
      .from('phone_webrtc_devices')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', ctx.user.id)
      .eq('status', 'active')
      .eq('provider', provider)
      .eq('connection_state', 'connected')
      .gte('last_seen_at', new Date(Date.now() - 120_000).toISOString());
    patch.presence_status = (otherOnlineDevices ?? 0) > 0 ? 'available' : 'offline';
    patch.last_presence_at = new Date().toISOString();
  } else {
    const ringMode = String(body.ringMode || '') as RingMode;
    const availabilitySource = String(body.availabilitySource || '') as AvailabilitySource;
    const schedule = safeSchedule(body.schedule);
    const ringSeconds = Number(body.ringSeconds);
    const voicemailGreeting = String(body.voicemailGreeting || '').trim();
    const externalFallbackEnabled = body.externalFallbackEnabled === true;
    const externalDigits = String(body.externalFallbackNumber || '').replace(/\D/g, '');
    const externalFallbackNumber =
      externalDigits.length === 10
        ? `+1${externalDigits}`
        : externalDigits.length === 11 && externalDigits.startsWith('1')
          ? `+${externalDigits}`
          : '';
    if (!RING_MODES.has(ringMode) || !AVAILABILITY_SOURCES.has(availabilitySource)) {
      return NextResponse.json(
        { error: 'Choose a valid phone and availability mode.' },
        { status: 400 },
      );
    }
    if (!schedule || !Number.isInteger(ringSeconds) || ringSeconds < 5 || ringSeconds > 60) {
      return NextResponse.json({ error: 'Schedule or ring duration is invalid.' }, { status: 400 });
    }
    if (externalFallbackEnabled && !externalFallbackNumber) {
      return NextResponse.json(
        { error: 'Enter a valid 10-digit fallback phone number.' },
        { status: 400 },
      );
    }
    if (voicemailGreeting.length > 600) {
      return NextResponse.json(
        { error: 'Voicemail greeting must be 600 characters or less.' },
        { status: 400 },
      );
    }
    Object.assign(patch, {
      ring_mode: ringMode,
      availability_source: availabilitySource,
      availability_schedule: schedule,
      ring_seconds: ringSeconds,
      voicemail_greeting: voicemailGreeting || null,
      admin_external_fallback: externalFallbackEnabled,
      external_fallback_number: externalFallbackEnabled ? externalFallbackNumber : null,
      presence_status: ['do_not_disturb', 'offline'].includes(ringMode) ? ringMode : 'offline',
      last_presence_at: new Date().toISOString(),
    });
    if (typeof body.emailMissedCalls === 'boolean' || typeof body.smsMissedCalls === 'boolean') {
      const { error: preferenceError } = await ctx.db.from('notification_preferences').upsert(
        {
          user_id: ctx.user.id,
          ...(typeof body.emailMissedCalls === 'boolean'
            ? { email_missed_calls: body.emailMissedCalls }
            : {}),
          ...(typeof body.smsMissedCalls === 'boolean'
            ? { sms_missed_calls: body.smsMissedCalls }
            : {}),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (preferenceError) {
        return NextResponse.json(
          { error: 'Missed-call email preference could not be saved.' },
          { status: 500 },
        );
      }
    }
  }
  const { error } = await ctx.db
    .from('communication_extensions')
    .update(patch)
    .eq('id', extension.id)
    .eq('profile_id', ctx.user.id);
  if (error)
    return NextResponse.json({ error: 'Phone settings could not be saved.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
