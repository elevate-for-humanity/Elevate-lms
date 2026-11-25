import { sendTwilioMessage } from './twilio';
import { SMS_AUTO_REPLY_EVENT_PREFIX } from './sms-threads';

/**
 * SMS auto-reply for inbound texts (TextFree parity): when a person texts a
 * business number, they immediately get one configured reply back — at most
 * once per sender per phone system in any 24-hour window.
 *
 * The setting lives on phone_systems (sms_auto_reply_enabled /
 * sms_auto_reply_message, added by migration
 * 20261125180000_sms_auto_reply_settings). Until that migration is applied
 * the columns do not exist; every read then fails and the feature reads as
 * OFF, so this code is safe to run before the migration lands.
 *
 * Each auto-reply is recorded as an ordinary outbound row in
 * communication_sms_messages (so it appears in the conversation thread),
 * marked by provider_event_id = 'auto-reply:<inbound provider event id>'.
 * That marker is also what the 24-hour dedupe looks for, so the dedupe
 * works the same before and after the migration.
 */

export const DEFAULT_SMS_AUTO_REPLY_MESSAGE =
  'Thank you for calling Elevate for Humanity. We received your message and will get back to you shortly.';
export const SMS_AUTO_REPLY_WINDOW_MS = 24 * 60 * 60 * 1000;

export type SmsAutoReplySetting = { enabled: boolean; message: string };

export type SmsAutoReplyResult = {
  sent: boolean;
  reason:
    | 'sent'
    | 'disabled'
    | 'self'
    | 'keyword'
    | 'auto-reply-pattern'
    | 'number-not-sms-capable'
    | 'already-replied-in-window'
    | 'record-failed'
    | 'send-failed';
  messageId?: string;
};

export function smsAutoReplyEventId(inboundEventId: string): string {
  return `${SMS_AUTO_REPLY_EVENT_PREFIX}${inboundEventId}`;
}

export function isSmsAutoReplyMarker(providerEventId: unknown): boolean {
  return (
    typeof providerEventId === 'string' &&
    providerEventId.startsWith(SMS_AUTO_REPLY_EVENT_PREFIX)
  );
}

const CARRIER_KEYWORDS = new Set([
  'STOP',
  'STOPALL',
  'UNSUBSCRIBE',
  'CANCEL',
  'END',
  'QUIT',
  'HELP',
  'INFO',
]);

/** Carrier keywords (STOP/HELP/…) must never receive an auto-reply. */
export function isCarrierKeyword(body: string): boolean {
  return CARRIER_KEYWORDS.has(String(body || '').trim().toUpperCase());
}

function normalizedText(value: string): string {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const AUTO_REPLY_SIGNATURES: RegExp[] = [
  /\bauto[- ]?reply\b/i,
  /\bautoreply\b/i,
  /\bautomated (message|reply|response)\b/i,
  /^this is an automated\b/i,
  /\bout[- ]of[- ]office\b/i,
  /\bdo not reply to this (message|number)\b/i,
];

/**
 * Loop safety: never auto-reply to a message that is itself an auto-reply —
 * our own configured text coming back at us, or another system's automated
 * response. A ping-pong between two auto-repliers is the failure this
 * guards against; the 24-hour dedupe window is the second layer.
 */
export function looksLikeAutoReply(body: string, configuredMessage: string): boolean {
  const text = normalizedText(body);
  if (!text) return false;
  const configured = normalizedText(configuredMessage);
  if (
    configured &&
    (text === configured ||
      (configured.length >= 20 && text.startsWith(configured.slice(0, 48))))
  )
    return true;
  return AUTO_REPLY_SIGNATURES.some((pattern) => pattern.test(text));
}

export async function getSmsAutoReplySetting(
  db: any,
  phoneSystemId: string,
): Promise<SmsAutoReplySetting> {
  const off: SmsAutoReplySetting = { enabled: false, message: DEFAULT_SMS_AUTO_REPLY_MESSAGE };
  if (!phoneSystemId) return off;
  const { data, error } = await db
    .from('phone_systems')
    .select('sms_auto_reply_enabled,sms_auto_reply_message')
    .eq('id', phoneSystemId)
    .maybeSingle();
  if (error || !data) return off;
  const message = String(data.sms_auto_reply_message || '').trim();
  return {
    enabled: data.sms_auto_reply_enabled === true,
    message: message || DEFAULT_SMS_AUTO_REPLY_MESSAGE,
  };
}

/**
 * Send the configured auto-reply for one stored inbound text, if warranted.
 * Never throws for a messaging outcome — the result says what happened; the
 * caller (the inbound webhook) treats every non-'sent' result as "no reply"
 * and still acknowledges the inbound text.
 */
export async function maybeSendSmsAutoReply(
  db: any,
  input: {
    phoneSystemId: string;
    /** The business number the inbound text was sent to; the reply sends from it. */
    businessNumber: string;
    /** The person who texted in; the reply sends to them. */
    senderNumber: string;
    inboundBody: string;
    /** Provider event id of the inbound message, e.g. 'twilio:SM…'. */
    inboundEventId: string;
    /** Owner of the inbound row, so the reply lands in the same workspace view. */
    ownerProfileId?: string | null;
    now?: Date;
  },
): Promise<SmsAutoReplyResult> {
  const setting = await getSmsAutoReplySetting(db, input.phoneSystemId);
  if (!setting.enabled) return { sent: false, reason: 'disabled' };
  if (!input.senderNumber || input.senderNumber === input.businessNumber)
    return { sent: false, reason: 'self' };
  if (isCarrierKeyword(input.inboundBody)) return { sent: false, reason: 'keyword' };
  if (looksLikeAutoReply(input.inboundBody, setting.message))
    return { sent: false, reason: 'auto-reply-pattern' };

  const { data: number } = await db
    .from('phone_numbers')
    .select('provider,capabilities,status')
    .eq('phone_system_id', input.phoneSystemId)
    .eq('e164', input.businessNumber)
    .maybeSingle();
  if (
    !number ||
    number.provider !== 'twilio' ||
    number.status !== 'active' ||
    number.capabilities?.sms !== true
  )
    return { sent: false, reason: 'number-not-sms-capable' };

  const now = input.now ?? new Date();
  const windowStart = new Date(now.getTime() - SMS_AUTO_REPLY_WINDOW_MS).toISOString();
  const { data: recent } = await db
    .from('communication_sms_messages')
    .select('status,provider_event_id')
    .eq('phone_system_id', input.phoneSystemId)
    .eq('direction', 'outbound')
    .eq('to_number', input.senderNumber)
    .gte('created_at', windowStart)
    .limit(50);
  if (
    (recent || []).some(
      (row: any) => isSmsAutoReplyMarker(row.provider_event_id) && row.status !== 'failed',
    )
  )
    return { sent: false, reason: 'already-replied-in-window' };

  // Record first, then send (the same order as a manual text in sms-api):
  // a carrier or webhook retry can never produce a second reply, because
  // the pending row already satisfies the dedupe check above.
  const { data: record, error } = await db
    .from('communication_sms_messages')
    .insert({
      phone_system_id: input.phoneSystemId,
      owner_profile_id: input.ownerProfileId ?? null,
      direction: 'outbound',
      from_number: input.businessNumber,
      to_number: input.senderNumber,
      body: setting.message,
      status: 'pending',
      provider_event_id: smsAutoReplyEventId(input.inboundEventId),
    })
    .select('id')
    .single();
  if (error || !record) return { sent: false, reason: 'record-failed' };
  try {
    const result = await sendTwilioMessage({
      from: input.businessNumber,
      to: input.senderNumber,
      body: setting.message,
    });
    const { error: saved } = await db
      .from('communication_sms_messages')
      .update({ status: 'accepted', provider_message_id: result.messageId })
      .eq('id', record.id);
    if (saved) throw Error('Receipt unavailable');
    return { sent: true, reason: 'sent', messageId: result.messageId };
  } catch {
    await db
      .from('communication_sms_messages')
      .update({
        status: 'failed',
        error_message: 'Auto-reply acceptance unconfirmed. Check the provider receipt before retrying.',
      })
      .eq('id', record.id);
    return { sent: false, reason: 'send-failed' };
  }
}
