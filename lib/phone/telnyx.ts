import 'server-only';

import type Telnyx from 'telnyx';
import { hydrateProcessEnv } from '@/lib/secrets';
import { resolveSendingNumber } from './sending-number';

export type TelnyxCallEvent = {
  data: {
    id: string;
    event_type: string;
    occurred_at: string;
    payload: {
      call_control_id: string;
      call_leg_id?: string;
      call_session_id?: string;
      from?: string;
      to?: string;
      direction?: string;
      client_state?: string;
      digits?: string;
      result?: string | Record<string, unknown>;
      partial_results?: Record<string, unknown>;
      status?: string;
      hangup_cause?: string;
      hangup_source?: string;
      message_history?: Array<{ role?: string; content?: string }>;
      recording_urls?: { mp3?: string; wav?: string };
      recording_id?: string;
      transcription_text?: string;
      duration_millis?: number;
    };
  };
};

export async function telnyxClient(): Promise<Telnyx> {
  // Retain types and historical evidence, but never instantiate the retired SDK,
  // even if legacy credentials are still present in the secret store.
  throw new Error('Telnyx is retired. Use Twilio and Elevate PBX.');
}

export async function verifyTelnyxWebhook(body: string, headers: Headers) {
  await hydrateProcessEnv();
  const publicKey = process.env.TELNYX_PUBLIC_KEY;
  if (!publicKey) throw new Error('TELNYX_PUBLIC_KEY is not configured.');

  // The SDK reads the public key from the client configuration. The exact raw
  // request body and Telnyx signature/timestamp headers must be passed through
  // unchanged or ED25519 verification will fail.
  const client = await telnyxClient();
  return client.webhooks.unwrap(body, {
    headers: Object.fromEntries(headers.entries()),
  }) as unknown as TelnyxCallEvent;
}

export function encodeCallState(value: Record<string, string>) {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64');
}

export function decodeCallState(value?: string): Record<string, string> {
  if (!value) return {};
  try {
    return JSON.parse(Buffer.from(value, 'base64').toString('utf8'));
  } catch {
    return {};
  }
}

export async function publicPhoneNumber() {
  await hydrateProcessEnv();
  const { requireAdminClient } = await import('@/lib/supabase/admin');
  const number = await resolveSendingNumber(await requireAdminClient());
  if (!number) throw new Error('An active primary Telnyx number is not configured');
  return number;
}

export function menuPrompt(greeting: string, options: Array<{ digit: number; label: string }>) {
  const choices = options.map((option) => `Press ${option.digit} for ${option.label}.`).join(' ');
  return `${greeting} ${choices}`.trim();
}

export function isOpenNow(
  hours: Record<string, [string, string]>,
  timeZone: string,
  now = new Date(),
) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const weekday = parts.find((part) => part.type === 'weekday')?.value.toLowerCase();
  const hour = parts.find((part) => part.type === 'hour')?.value;
  const minute = parts.find((part) => part.type === 'minute')?.value;
  if (!weekday || !hour || !minute) return false;
  const window = hours[weekday];
  if (!window) return false;
  const current = `${hour}:${minute}`;
  return current >= window[0] && current < window[1];
}
