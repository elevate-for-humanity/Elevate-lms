import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { hydrateProcessEnv } from '@/lib/secrets';

export const TWILIO_SMS_WEBHOOK = 'https://admin.elevateforhumanity.org/api/webhooks/twilio/sms';
export const SMS_MEDIA_BUCKET = 'communication-sms-media';

export function twilioAccountSid() {
  const account = process.env.TWILIO_ACCOUNT_SID?.trim() || process.env.TWILIO_SID?.trim() || '';
  if (!/^AC[a-f0-9]{32}$/i.test(account)) throw Error('Twilio account is not configured.');
  return account;
}

export function twilioAuthorization() {
  const account = twilioAccountSid();
  const key = process.env.TWILIO_API_KEY_SID?.trim();
  const secret = process.env.TWILIO_API_KEY_SECRET?.trim();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (key && secret && /^SK[a-f0-9]{32}$/i.test(key))
    return 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64');
  if (!token) throw Error('Twilio messaging credentials are unavailable.');
  return 'Basic ' + Buffer.from(`${account}:${token}`).toString('base64');
}

export function validTwilioSignature(token: string, url: string, params: URLSearchParams, signature: string) {
  if (!token || !/^[A-Za-z0-9+/]{27}=$/.test(signature)) return false;
  // Preserve every decoded field and whitespace; do not trust forwarded host headers.
  const keys = [...new Set(params.keys())].sort();
  if (keys.some((key) => params.getAll(key).length !== 1)) return false;
  const text = url + keys.map((key) => key + params.get(key)).join('');
  const expected = createHmac('sha1', token).update(text).digest();
  const actual = Buffer.from(signature, 'base64');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function sendTwilioMessage(input: { from: string; to: string; body: string; mediaUrls?: string[] }) {
  await hydrateProcessEnv();
  if (!/^\+[1-9]\d{7,14}$/.test(input.from) || !/^\+[1-9]\d{7,14}$/.test(input.to))
    throw Error('A valid business sender and recipient are required.');
  const params = new URLSearchParams({ From: input.from, To: input.to, Body: input.body,
    StatusCallback: TWILIO_SMS_WEBHOOK + '/status' });
  for (const url of input.mediaUrls || []) params.append('MediaUrl', url);
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid()}/Messages.json`, {
    method: 'POST', headers: { Authorization: twilioAuthorization(), 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(), redirect: 'error', signal: AbortSignal.timeout(15000),
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || !/^(?:SM|MM)[a-f0-9]{32}$/i.test(result?.sid || ''))
    throw Error('Twilio did not confirm message acceptance.');
  return { messageId: String(result.sid) };
}

export async function resolveTwilioSendingNumber(db: any): Promise<string | null> {
  const { data: system, error: systemError } = await db.from('phone_systems').select('id').is('tenant_id', null).maybeSingle();
  if (systemError || !system) return null;
  const { data: number, error } = await db.from('phone_numbers').select('e164,capabilities').eq('phone_system_id', system.id)
    .eq('provider', 'twilio').eq('source', 'provider').eq('is_primary', true).eq('status', 'active').maybeSingle();
  return !error && number?.capabilities?.sms === true && /^\+[1-9]\d{7,14}$/.test(number?.e164 || '') ? number.e164 : null;
}

export type SmsMedia = { kind: 'twilio'; sid: string; contentType: string } |
  { kind: 'storage'; path: string; contentType: string };

export function inboundTwilioMedia(params: URLSearchParams): SmsMedia[] {
  const count = Number(params.get('NumMedia') || '0');
  if (!Number.isInteger(count) || count < 0 || count > 10) throw Error('Invalid media count');
  const account = twilioAccountSid(), message = params.get('MessageSid');
  if (!/^(?:SM|MM)[a-f0-9]{32}$/i.test(message || '')) throw Error('Invalid media message');
  return Array.from({ length: count }, (_, index) => {
    const url = new URL(params.get(`MediaUrl${index}`) || '');
    const match = url.pathname.match(new RegExp(`^/2010-04-01/Accounts/${account}/Messages/${message}/Media/(ME[a-f0-9]{32})$`, 'i'));
    if (url.origin !== 'https://api.twilio.com' || url.username || url.password || url.search || url.hash || !match)
      throw Error('Invalid message media reference');
    return { kind: 'twilio' as const, sid: match[1], contentType: params.get(`MediaContentType${index}`) || 'application/octet-stream' };
  });
}
