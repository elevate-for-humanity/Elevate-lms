import { formatUsPhone, normalizeUsPhone } from '@/lib/phone/config';

/**
 * Conversation threading for carrier SMS (communication_sms_messages rows as
 * returned by lib/phone/sms-api). The API returns a flat, newest-first list;
 * the texts workspace groups it into one thread per counterparty number so
 * the operator sees conversations the way a phone messaging app shows them.
 * Pure functions only — no I/O — so the grouping is unit-testable.
 */

export type SmsMessageLike = {
  id: string;
  direction?: string | null;
  from_number?: string | null;
  to_number?: string | null;
  body?: string | null;
  media?: unknown;
  status?: string | null;
  error_message?: string | null;
  created_at?: string | null;
};

export type SmsThread = {
  /** Stable grouping key: the normalized counterparty number when possible. */
  key: string;
  /** Counterparty number as stored on the most recent message. */
  number: string;
  /** Caller-facing form of the counterparty number. */
  displayName: string;
  /** Messages in the thread, oldest first. */
  messages: SmsMessageLike[];
  lastMessage: SmsMessageLike;
  /** ISO timestamp of the newest message in the thread. */
  lastActivityAt: string;
  inboundCount: number;
  outboundCount: number;
};

/**
 * The other party of a message: the sender for inbound texts, the recipient
 * for outbound ones. Returns a grouping key (normalized +1 number when the
 * value parses as a US number, otherwise the trimmed raw value), or null
 * when the message carries no counterparty at all.
 */
export function smsCounterpartyKey(message: SmsMessageLike): string | null {
  const raw = message.direction === 'inbound' ? message.from_number : message.to_number;
  const value = String(raw ?? '').trim();
  if (!value) return null;
  return normalizeUsPhone(value) ?? value;
}

function messageTime(message: SmsMessageLike): number {
  const parsed = Date.parse(String(message.created_at ?? ''));
  return Number.isNaN(parsed) ? 0 : parsed;
}

/** One-line preview of a message for the conversation list. */
export function smsThreadPreview(message: SmsMessageLike): string {
  const body = String(message.body ?? '').trim();
  if (body) return body;
  if (Array.isArray(message.media) && message.media.length > 0) return 'Picture message';
  return '';
}

/**
 * Group a flat message list (any order; the API sends newest first) into
 * threads: one per counterparty, messages oldest-first inside a thread,
 * threads ordered by most recent activity first. Messages with no
 * counterparty number cannot be threaded and are skipped.
 */
export function groupSmsThreads(messages: readonly SmsMessageLike[]): SmsThread[] {
  const byKey = new Map<string, SmsMessageLike[]>();
  for (const message of messages) {
    const key = smsCounterpartyKey(message);
    if (!key) continue;
    const list = byKey.get(key);
    if (list) list.push(message);
    else byKey.set(key, [message]);
  }
  const threads: SmsThread[] = [];
  for (const [key, list] of byKey) {
    const ordered = [...list].sort((a, b) => messageTime(a) - messageTime(b));
    const lastMessage = ordered[ordered.length - 1];
    const number = String(
      (lastMessage.direction === 'inbound' ? lastMessage.from_number : lastMessage.to_number) ??
        key,
    );
    threads.push({
      key,
      number,
      displayName: formatUsPhone(number),
      messages: ordered,
      lastMessage,
      lastActivityAt: String(lastMessage.created_at ?? ''),
      inboundCount: ordered.filter((message) => message.direction === 'inbound').length,
      outboundCount: ordered.filter((message) => message.direction !== 'inbound').length,
    });
  }
  threads.sort((a, b) => messageTime(b.lastMessage) - messageTime(a.lastMessage));
  return threads;
}
