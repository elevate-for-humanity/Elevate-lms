// pre-auth-registry: exempt - requireProgramHolder verifies the authenticated holder and every query is profile-scoped.
import { NextResponse } from 'next/server';
import { requireCommunicationActor } from '@/lib/communications/actor';
import {
  DEFAULT_AVAILABILITY_SCHEDULE,
  type AvailabilitySchedule,
  type AvailabilitySource,
  type RingMode,
} from '@/lib/phone/availability';
import { publicPhoneNumber } from '@/lib/phone/telnyx';

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
  const { data: system } = systemId
    ? await ctx.db
        .from('phone_systems')
        .select('id,name,timezone,status')
        .eq('id', systemId)
        .maybeSingle()
    : { data: null };
  return { ctx, extension, system };
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
  const { ctx, extension, system } = await phoneContext();
  if (!extension || !system) {
    return NextResponse.json(
      { error: 'An administrator has not assigned a phone extension to this account.' },
      { status: 404 },
    );
  }
  const [{ data: inbox, error }, { data: notificationPreferences }] = await Promise.all([
    ctx.db
      .from('phone_callback_tasks')
      .select(
        'id,source,caller_name,callback_number,reason,program_or_department,urgency,preferred_callback_time,transcript,summary,status,read_at,created_at,recording_url',
      )
      .eq('assigned_profile_id', ctx.user.id)
      .order('created_at', { ascending: false })
      .limit(100),
    ctx.db
      .from('notification_preferences')
      .select('email_missed_calls')
      .eq('user_id', ctx.user.id)
      .maybeSingle(),
  ]);
  if (error)
    return NextResponse.json({ error: 'Phone inbox could not be loaded.' }, { status: 500 });
  return NextResponse.json({
    phoneNumber: publicPhoneNumber(),
    system: { name: system.name, timezone: system.timezone, status: system.status },
    notifications: { emailMissedCalls: notificationPreferences?.email_missed_calls !== false },
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
      presenceStatus: extension.presence_status,
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
  if (!ctx.roles.some((role) => role === 'program_holder' || role === 'programholder')) {
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  }
  if (!extension) {
    return NextResponse.json({ error: 'No phone extension is assigned.' }, { status: 404 });
  }
  const body = await request.json().catch(() => ({}));
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.action === 'heartbeat') {
    const deviceId = String(body.deviceId || '');
    if (!DEVICE_ID.test(deviceId)) {
      return NextResponse.json(
        { error: 'A valid PWA device identifier is required.' },
        { status: 400 },
      );
    }
    patch.last_presence_at = new Date().toISOString();
    patch.presence_status = ['do_not_disturb', 'offline'].includes(extension.ring_mode)
      ? extension.ring_mode
      : 'available';
    await ctx.db
      .from('phone_webrtc_devices')
      .update({ last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('profile_id', ctx.user.id)
      .eq('device_id', deviceId)
      .eq('status', 'active');
  } else if (body.action === 'disconnect') {
    const deviceId = String(body.deviceId || '');
    if (!DEVICE_ID.test(deviceId)) {
      return NextResponse.json(
        { error: 'A valid PWA device identifier is required.' },
        { status: 400 },
      );
    }
    await ctx.db
      .from('phone_webrtc_devices')
      .update({ last_seen_at: '1970-01-01T00:00:00.000Z', updated_at: new Date().toISOString() })
      .eq('profile_id', ctx.user.id)
      .eq('device_id', deviceId)
      .eq('status', 'active');
    const { count: otherOnlineDevices } = await ctx.db
      .from('phone_webrtc_devices')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', ctx.user.id)
      .eq('status', 'active')
      .gte('last_seen_at', new Date(Date.now() - 120_000).toISOString());
    patch.presence_status = (otherOnlineDevices ?? 0) > 0 ? 'available' : 'offline';
    patch.last_presence_at = new Date().toISOString();
  } else {
    const ringMode = String(body.ringMode || '') as RingMode;
    const availabilitySource = String(body.availabilitySource || '') as AvailabilitySource;
    const schedule = safeSchedule(body.schedule);
    const ringSeconds = Number(body.ringSeconds);
    const voicemailGreeting = String(body.voicemailGreeting || '').trim();
    if (!RING_MODES.has(ringMode) || !AVAILABILITY_SOURCES.has(availabilitySource)) {
      return NextResponse.json(
        { error: 'Choose a valid phone and availability mode.' },
        { status: 400 },
      );
    }
    if (!schedule || !Number.isInteger(ringSeconds) || ringSeconds < 5 || ringSeconds > 60) {
      return NextResponse.json({ error: 'Schedule or ring duration is invalid.' }, { status: 400 });
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
      presence_status: ['do_not_disturb', 'offline'].includes(ringMode) ? ringMode : 'available',
      last_presence_at: new Date().toISOString(),
    });
    if (typeof body.emailMissedCalls === 'boolean') {
      const { error: preferenceError } = await ctx.db.from('notification_preferences').upsert(
        {
          user_id: ctx.user.id,
          email_missed_calls: body.emailMissedCalls,
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
