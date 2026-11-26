import 'server-only';
import type { PushNotification } from '@/lib/notifications/push-service';

/**
 * Call-wake push (PWA ring fix, cause 1 of the 2026-11-25 ring audit): when an
 * inbound call is routed to a PWA extension whose app is not currently
 * registered, the owner's phone gets a Web Push immediately, so it buzzes and
 * shows a persistent incoming-call notification. Tapping the notification
 * opens the phone page in wake mode (`?wake=1`), which connects/registers at
 * once and surfaces the incoming-call UI.
 *
 * Trigger contract: the PBX side POSTs to /api/internal/phone/call-alert the
 * moment a call is routed to an extension (same bearer-token contract as the
 * voicemail ingestion route). This module is the targeting core: given the
 * resolved extension row it decides whether a wake is warranted and builds
 * the notification. A wake is sent ONLY when no device for the extension is
 * currently live, using the exact presence derivation the phone route uses
 * (phone_webrtc_devices: status 'active', provider 'asterisk',
 * connection_state 'connected', last_seen_at within 120 seconds) — an
 * already-open app rings on its own and must not double-alert.
 *
 * Ring modes that silence the phone (offline / do_not_disturb / silent) also
 * silence the wake: the holder chose not to be rung. 'ring' and 'vibrate'
 * wake. The holder's push preference (notification_preferences.push_enabled)
 * is honored the same way as for missed-call alerts.
 *
 * The send is best-effort by design: every failure path resolves to a result
 * object, never a throw, so a wake problem can never affect call handling.
 * The sender is injected so this module stays free of provider imports and
 * unit-testable; the route wires in PushNotificationService.
 */

export const CALL_WAKE_TYPE = 'incoming_call';
/** Mirrors the live-device window in apps/lms/app/api/program-holder/phone/route.ts. */
export const CALL_WAKE_LIVE_WINDOW_MS = 120_000;
export const CALL_WAKE_VIBRATE = [400, 200, 400, 200, 400, 200, 400];

export type CallWakeInput = {
  callId: string;
  extension: string;
  /** Validated caller identifier: 'unknown', a short extension, or E.164-ish. */
  caller: string;
  callerName?: string | null;
};

export type CallWakeExtension = {
  id: string;
  profile_id?: string | null;
  ring_mode?: string | null;
};

export type CallWakeReason =
  | 'sent'
  | 'no_recipient'
  | 'ring_mode_muted'
  | 'device_live'
  | 'push_disabled'
  | 'no_subscriptions';

export type CallWakeResult = {
  sent: boolean;
  reason: CallWakeReason;
  acceptedDeviceCount?: number;
};

export type CallWakePlan =
  | { send: true }
  | { send: false; reason: Exclude<CallWakeReason, 'sent'> };

function isCallWakeSkip(
  plan: CallWakePlan,
): plan is { send: false; reason: Exclude<CallWakeReason, 'sent'> } {
  return !plan.send;
}

const MUTED_RING_MODES = new Set(['offline', 'do_not_disturb', 'silent']);

/** Pure targeting decision, in priority order. */
export function planCallWake(input: {
  profileId?: string | null;
  ringMode?: string | null;
  liveDeviceCount: number;
  pushEnabled?: boolean | null;
}): CallWakePlan {
  if (!input.profileId) return { send: false, reason: 'no_recipient' };
  if (MUTED_RING_MODES.has(String(input.ringMode || ''))) {
    return { send: false, reason: 'ring_mode_muted' };
  }
  if (input.liveDeviceCount > 0) return { send: false, reason: 'device_live' };
  if (input.pushEnabled === false) return { send: false, reason: 'push_disabled' };
  return { send: true };
}

/** Count devices that would ring on their own right now (presence derivation). */
export async function countLiveDevices(
  db: any,
  extensionId: string,
  now: Date = new Date(),
): Promise<number> {
  const { count, error } = await db
    .from('phone_webrtc_devices')
    .select('id', { count: 'exact', head: true })
    .eq('extension_id', extensionId)
    .eq('status', 'active')
    .eq('provider', 'asterisk')
    .eq('connection_state', 'connected')
    .gte('last_seen_at', new Date(now.getTime() - CALL_WAKE_LIVE_WINDOW_MS).toISOString());
  if (error) throw new Error('call_wake_presence_unavailable');
  return count ?? 0;
}

export function callWakeCallerLabel(input: CallWakeInput): string {
  const name = String(input.callerName || '').replace(/\s+/g, ' ').trim();
  if (name) return name.slice(0, 80);
  const caller = String(input.caller || '').trim();
  if (!caller || caller === 'unknown') return 'Unknown caller';
  return caller;
}

/** The phone page the notification opens, in wake mode, on the Admin app. */
export function buildCallWakeUrl(input: CallWakeInput): string {
  const params = new URLSearchParams({
    wake: '1',
    call: input.callId,
    from: String(input.caller || 'unknown'),
  });
  return `/phone/dial-pad?${params.toString()}`;
}

export function buildCallWakeNotification(input: CallWakeInput): PushNotification {
  const label = callWakeCallerLabel(input);
  return {
    title: `Incoming call — ${label}`,
    body: `Extension ${input.extension} is ringing now. Tap to open your phone and answer.`,
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    url: buildCallWakeUrl(input),
    tag: `incoming-call-${input.callId}`,
    requireInteraction: true,
    vibrate: [...CALL_WAKE_VIBRATE],
    data: {
      type: CALL_WAKE_TYPE,
      callId: input.callId,
      extension: input.extension,
      caller: String(input.caller || 'unknown'),
    },
  };
}

/**
 * Orchestrates one wake: presence check → preference check → plan → send.
 * `sendPush` is PushNotificationService.sendToUserWithDatabase in production.
 * Never throws for send-side failures; a presence lookup failure is the one
 * throw (call_wake_presence_unavailable) so the route can answer with its
 * fixed diagnostic vocabulary instead of waking blindly.
 */
export async function sendCallWakePush(
  db: any,
  extension: CallWakeExtension,
  input: CallWakeInput,
  sendPush: (profileId: string, notification: PushNotification) => Promise<number>,
): Promise<CallWakeResult> {
  const profileId = extension.profile_id || null;
  if (!profileId) return { sent: false, reason: 'no_recipient' };
  if (MUTED_RING_MODES.has(String(extension.ring_mode || ''))) {
    return { sent: false, reason: 'ring_mode_muted' };
  }
  const liveDeviceCount = await countLiveDevices(db, extension.id);
  const { data: preferences } = await db
    .from('notification_preferences')
    .select('push_enabled')
    .eq('user_id', profileId)
    .maybeSingle();
  const plan = planCallWake({
    profileId,
    ringMode: extension.ring_mode,
    liveDeviceCount,
    pushEnabled: preferences?.push_enabled,
  });
  if (isCallWakeSkip(plan)) return { sent: false, reason: plan.reason };
  let acceptedDeviceCount = 0;
  try {
    acceptedDeviceCount = await sendPush(profileId, buildCallWakeNotification(input));
  } catch {
    acceptedDeviceCount = 0;
  }
  if (acceptedDeviceCount <= 0) return { sent: false, reason: 'no_subscriptions' };
  return { sent: true, reason: 'sent', acceptedDeviceCount };
}
