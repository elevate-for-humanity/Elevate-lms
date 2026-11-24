import { logger } from '@/lib/logger';

/**
 * SendGrid Inbound Parse delivers a multipart/form-data POST.
 * This parses the relevant fields from the FormData.
 */
export interface ParsedInboundEmail {
  from: string;
  to: string;
  cc?: string;
  providerMessageId?: string;
  subject: string;
  html: string;
  text: string;
  replyTo: string;
  eventId: string; // Stable message identity for per-mailbox deduplication
  deliveryId?: string; // Includes the normalized SMTP envelope for delivery claims
  envelopeRecipients: string[];
  hasEnvelope?: boolean;
  attachments: File[];
  headers?: string;
}

/** SMTP envelope is authoritative; display headers must not add deliveries. */
export function inboundDeliveryRecipients(
  parsed: Pick<ParsedInboundEmail, 'envelopeRecipients' | 'hasEnvelope' | 'to'>,
): string[] {
  return parsed.hasEnvelope || parsed.envelopeRecipients.length
    ? parseEnvelopeAddresses(JSON.stringify({ to: parsed.envelopeRecipients }))
    : parseEnvelopeAddresses(parsed.to);
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
    const cc = String(formData.get('cc') ?? '');
    const subject = String(formData.get('subject') ?? '(no subject)');
    const html = String(formData.get('html') ?? '');
    const text = String(formData.get('text') ?? '');
    const headers = String(formData.get('headers') || '');
    const replyTo = String(formData.get('reply-to') ?? headers.match(/^Reply-To:[ \t]*([^\r\n]+)/im)?.[1] ?? from);
    const providerId = headers.match(/^Message-ID:\s*(.+)$/im)?.[1]?.trim();
    const timestamp = String(formData.get('timestamp') || providerId || '');
    const rawEnvelope = formData.get('envelope');
    let envelopeRecipients: string[] = [];
    if (typeof rawEnvelope === 'string') {
      try {
        const envelope: unknown = JSON.parse(rawEnvelope);
        if (envelope && typeof envelope === 'object' && 'to' in envelope && Array.isArray(envelope.to)) {
          envelopeRecipients = parseEnvelopeAddresses(envelope.to.filter((address) => typeof address === 'string').join(','));
        }
      } catch {
        // An invalid envelope must go to routing review rather than display-header delivery.
      }
    }
    const hasEnvelope = rawEnvelope !== null;
    const attachments = inboundAttachmentEntries(formData);

    // Stable dedup key — SendGrid doesn't provide a unique event ID in Inbound Parse
    const { createHash } = await import('crypto');
    const eventId = createHash('sha256')
      .update(`${from}|${to}|${subject}|${timestamp}|${text}|${html}`)
      .digest('hex')
      .slice(0, 32);

    const deliveryId = createHash('sha256')
      .update(JSON.stringify([eventId, [...inboundDeliveryRecipients({ envelopeRecipients, hasEnvelope, to })].sort()]))
      .digest('hex').slice(0, 32);

    return {
      deliveryId,
      from,
      to,
      cc,
      providerMessageId: providerId,
      subject,
      html,
      text,
      replyTo,
      eventId,
      envelopeRecipients,
      hasEnvelope,
      attachments,
      headers,
    };
  } catch {
    logger.error('[SendGrid Inbound] Failed to parse form data');
    return null;
  }
}
