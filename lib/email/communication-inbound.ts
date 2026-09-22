import { randomUUID } from 'node:crypto';
import { requireAdminClient } from '@/lib/supabase/admin';
import { normalizeEmailSubject, parseEmailList } from '@/lib/email/communication-email';
import { safeAttachmentName, type ParsedInboundEmail } from '@/lib/email/sendgrid-inbound';

const ATTACHMENT_BUCKET = 'communication-email-attachments';
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/csv',
  'text/plain',
]);

function senderName(from: string): string | null {
  const match = from.match(/^\s*([^<]+?)\s*<[^>]+>/);
  return (
    match?.[1]
      ?.replace(/[<>\r\n"]/g, '')
      .trim()
      .slice(0, 120) || null
  );
}

function textFromInbound(parsed: ParsedInboundEmail): string {
  if (parsed.text.trim()) return parsed.text.trim().slice(0, 100_000);
  return parsed.html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100_000);
}

export async function storeInboundCommunicationEmail(
  parsed: ParsedInboundEmail,
): Promise<{ stored: boolean; mailboxCount: number }> {
  const recipients = Array.from(
    new Set([...parsed.envelopeRecipients, ...parseEmailList(parsed.to)]),
  );
  if (!recipients.length) return { stored: false, mailboxCount: 0 };

  const db = await requireAdminClient();
  const { data: mailboxes, error } = await db
    .from('communication_email_mailboxes')
    .select('id,address')
    .in('address', recipients)
    .eq('active', true);
  if (error || !mailboxes?.length) return { stored: false, mailboxCount: 0 };

  const senderEmail =
    parseEmailList(parsed.replyTo || parsed.from)[0] || parseEmailList(parsed.from)[0];
  if (!senderEmail) return { stored: false, mailboxCount: 0 };
  const subject =
    String(parsed.subject || '(no subject)')
      .replace(/[\r\n]+/g, ' ')
      .trim()
      .slice(0, 240) || '(no subject)';
  const normalizedSubject = normalizeEmailSubject(subject);
  const textBody = textFromInbound(parsed);
  let storedCount = 0;

  for (const mailbox of mailboxes) {
    const inboundEventId = `${parsed.eventId}:${mailbox.id}`;
    const { data: duplicate } = await db
      .from('communication_email_messages')
      .select('id')
      .eq('inbound_event_id', inboundEventId)
      .maybeSingle();
    if (duplicate) {
      storedCount += 1;
      continue;
    }

    let { data: thread } = await db
      .from('communication_email_threads')
      .select('id,message_count')
      .eq('mailbox_id', mailbox.id)
      .eq('normalized_subject', normalizedSubject)
      .order('last_message_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!thread) {
      const created = await db
        .from('communication_email_threads')
        .insert({
          mailbox_id: mailbox.id,
          subject,
          normalized_subject: normalizedSubject,
          message_count: 0,
        })
        .select('id,message_count')
        .single();
      if (created.error || !created.data) continue;
      thread = created.data;
    }

    const messageId = randomUUID();
    const receivedAt = new Date().toISOString();
    const { error: messageError } = await db.from('communication_email_messages').insert({
      id: messageId,
      thread_id: thread.id,
      mailbox_id: mailbox.id,
      direction: 'inbound',
      status: 'received',
      inbound_event_id: inboundEventId,
      sender_email: senderEmail,
      sender_name: senderName(parsed.from),
      to_addresses: recipients,
      cc_addresses: [],
      bcc_addresses: [],
      reply_to: senderEmail,
      subject,
      text_body: textBody,
      html_body: parsed.html || null,
      received_at: receivedAt,
    });
    if (messageError) continue;

    for (const file of parsed.attachments) {
      if (
        file.size <= 0 ||
        file.size > MAX_ATTACHMENT_BYTES ||
        !ALLOWED_ATTACHMENT_TYPES.has(file.type)
      )
        continue;
      const fileName = safeAttachmentName(file.name);
      const storagePath = `${mailbox.id}/${messageId}/${randomUUID()}-${fileName}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await db.storage
        .from(ATTACHMENT_BUCKET)
        .upload(storagePath, bytes, { contentType: file.type, upsert: false });
      if (uploadError) continue;
      await db.from('communication_email_attachments').insert({
        message_id: messageId,
        mailbox_id: mailbox.id,
        storage_path: storagePath,
        file_name: fileName,
        mime_type: file.type,
        size_bytes: file.size,
      });
    }

    await db
      .from('communication_email_threads')
      .update({
        last_message_at: receivedAt,
        message_count: Number(thread.message_count || 0) + 1,
        updated_at: receivedAt,
      })
      .eq('id', thread.id);
    storedCount += 1;
  }

  return { stored: storedCount > 0, mailboxCount: storedCount };
}
