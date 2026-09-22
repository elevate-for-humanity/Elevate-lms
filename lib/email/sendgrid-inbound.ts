import { logger } from '@/lib/logger';

// Forward map: local-part of recipient address → destination Gmail
export const FORWARD_MAP: Record<string, string> = {
  info: 'elevate4humanityedu@gmail.com',
  support: 'elevate4humanityedu@gmail.com',
  admissions: 'elevate4humanityedu@gmail.com',
  enrollment: 'elevate4humanityedu@gmail.com',
  contact: 'elevate4humanityedu@gmail.com',
};
export const DEFAULT_FORWARD = 'elevate4humanityedu@gmail.com';

/**
 * SendGrid Inbound Parse delivers a multipart/form-data POST.
 * This parses the relevant fields from the FormData.
 */
export interface ParsedInboundEmail {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo: string;
  eventId: string; // SHA-256 of from+to+subject+timestamp for dedup
  envelopeRecipients: string[];
  attachments: File[];
}

export function parseEnvelopeAddresses(value: unknown): string[] {
  let source = String(value || '');
  try {
    const parsed = JSON.parse(source) as { to?: unknown };
    source = Array.isArray(parsed?.to) ? parsed.to.join(',') : source;
  } catch {
    // SendGrid may omit the envelope field. The visible To header is the fallback.
  }
  const matches = source.match(/[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? [];
  return Array.from(new Set(matches.map((address) => address.toLowerCase())));
}

export function safeAttachmentName(value: unknown): string {
  const leaf =
    String(value || 'attachment')
      .split(/[\\/]/)
      .pop() || 'attachment';
  return (
    Array.from(leaf)
      .filter((character) => {
        const code = character.charCodeAt(0);
        return code >= 32 && code !== 127;
      })
      .join('')
      .replace(/[<>:"|?*]/g, '')
      .replace(/^\.+/, '')
      .trim()
      .slice(0, 180) || 'attachment'
  );
}

export function inboundAttachmentEntries(formData: FormData): File[] {
  return Array.from(formData.entries())
    .filter(([key, value]) => key.toLowerCase().startsWith('attachment') && value instanceof File)
    .map(([, value]) => value as File)
    .slice(0, 10);
}

export async function parseInboundEmail(request: Request): Promise<ParsedInboundEmail | null> {
  try {
    const formData = await request.formData();

    const from = String(formData.get('from') ?? '');
    const to = String(formData.get('to') ?? '');
    const subject = String(formData.get('subject') ?? '(no subject)');
    const html = String(formData.get('html') ?? '');
    const text = String(formData.get('text') ?? '');
    const replyTo = String(formData.get('reply-to') ?? from);
    const timestamp = String(formData.get('timestamp') ?? Date.now());
    const envelopeRecipients = parseEnvelopeAddresses(formData.get('envelope') ?? to);
    const attachments = inboundAttachmentEntries(formData);

    // Stable dedup key — SendGrid doesn't provide a unique event ID in Inbound Parse
    const { createHash } = await import('crypto');
    const eventId = createHash('sha256')
      .update(`${from}|${to}|${subject}|${timestamp}`)
      .digest('hex')
      .slice(0, 32);

    return { from, to, subject, html, text, replyTo, eventId, envelopeRecipients, attachments };
  } catch (err) {
    logger.error('[SendGrid Inbound] Failed to parse form data:', err);
    return null;
  }
}

/**
 * Resolve the forwarding destination from the To address.
 * Matches on the local-part prefix against FORWARD_MAP; falls back to DEFAULT_FORWARD.
 */
export function resolveForwardTarget(toAddress: string): string {
  // toAddress may be "Name <email>" or just "email"
  const emailMatch = toAddress.match(/<(.+?)>/) ?? toAddress.match(/(\S+@\S+)/);
  const email = emailMatch?.[1] ?? toAddress;
  const prefix = email.split('@')[0]?.toLowerCase();
  if (prefix && FORWARD_MAP[prefix]) return FORWARD_MAP[prefix];
  return DEFAULT_FORWARD;
}
