import 'server-only';

import Telnyx from 'telnyx';

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
      result?: string;
      recording_urls?: { mp3?: string; wav?: string };
      recording_id?: string;
      transcription_text?: string;
      duration_millis?: number;
    };
  };
};

export function telnyxClient() {
  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) throw new Error('TELNYX_API_KEY is not configured.');
  return new Telnyx({ apiKey, publicKey: process.env.TELNYX_PUBLIC_KEY });
}

export async function verifyTelnyxWebhook(body: string, headers: Headers) {
  const publicKey = process.env.TELNYX_PUBLIC_KEY;
  if (!publicKey) throw new Error('TELNYX_PUBLIC_KEY is not configured.');

  // The SDK reads the public key from the client configuration. The exact raw
  // request body and Telnyx signature/timestamp headers must be passed through
  // unchanged or ED25519 verification will fail.
  const client = telnyxClient();
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
