import { randomUUID } from 'node:crypto';
import { applyMailFilters, isGmailCopy, isRelevantCopy, isAutomatedMail } from './mail-filters';
import { requireAdminClient } from '@/lib/supabase/admin';
import { normalizeEmailSubject, parseEmailList } from '@/lib/email/communication-email';
import { safeAttachmentName, type ParsedInboundEmail } from '@/lib/email/sendgrid-inbound';
import {
  applicantConversationSubject,
  programConversationRoute,
} from './program-conversation-routing';

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
  options: { applicantEmail?: string; internalCopy?: boolean } = {},
): Promise<{ stored: boolean; mailboxCount: number; filtered?: boolean }> {
  let recipients = Array.from(
    new Set([...parsed.envelopeRecipients, ...parseEmailList(parsed.to)]),
  );
  if (!recipients.length) return { stored: false, mailboxCount: 0 };

  const db = await requireAdminClient();
  const originalSender = parseEmailList(parsed.from)[0];
  const route = options.internalCopy
    ? null
    : await programConversationRoute(db, [originalSender || ''], recipients);
  // Business addresses without their own active mailbox are routed to Admissions.
  if (
    !options.internalCopy &&
    recipients.some((address) => address.endsWith('@elevateforhumanity.org'))
  )
    recipients = [...new Set([...recipients, 'admissions@elevateforhumanity.org'])];
  if (route) recipients = [...new Set([...recipients, ...route.addresses])];
  const { data: mailboxes, error } = await db
    .from('communication_email_mailboxes')
    .select('id,address')
    .in('address', recipients)
    .eq('active', true);
  if (error || !mailboxes?.length) return { stored: false, mailboxCount: 0 };

  const senderEmail = parseEmailList(parsed.from)[0];
  if (!senderEmail) return { stored: false, mailboxCount: 0 };
  const subject =
    String(parsed.subject || '(no subject)')
      .replace(/[\r\n]+/g, ' ')
      .trim()
      .slice(0, 240) || '(no subject)';
  const applicantEmail = options.applicantEmail || route?.applicantEmail || originalSender;
  const normalizedSubject = applicantEmail
    ? applicantConversationSubject(subject, applicantEmail)
    : normalizeEmailSubject(subject);
  const textBody = textFromInbound(parsed);
  let storedCount = 0;
  let filteredCount = 0;

  for (const mailbox of mailboxes) {
    const { data: filters, error: filterError } = await db
      .from('communication_email_filters')
      .select('field,contains,action,folder_id,enabled')
      .eq('mailbox_id', mailbox.id)
      .order('created_at');
    if (filterError) throw new Error('Mail filters unavailable');
    const rule = options.internalCopy
      ? null
      : applyMailFilters(filters || [], { sender: senderEmail, subject, body: textBody });
    if (
      rule?.skip ||
      (!options.internalCopy &&
        isGmailCopy(parsed.headers) &&
        !isRelevantCopy(
          { sender: senderEmail, subject, body: textBody, headers: parsed.headers },
          !!route,
        ))
    ) {
      filteredCount++;
      continue;
    }
    const { data: folders } = await db
      .from('communication_email_folders')
      .select('id,name')
      .eq('mailbox_id', mailbox.id);
    const automated = isAutomatedMail(senderEmail, parsed.headers, subject);
    const suggested = automated
      ? 'System Notices'
      : /host shop|program holder|partner/i.test(subject)
        ? 'Host Shops & Partners'
        : /student|attendance|class|hours/i.test(subject)
          ? 'Students'
          : 'Admissions & Applicants';
    const folderId =
      rule?.folderId || folders?.find((folder: any) => folder.name === suggested)?.id || null;
    const destination = rule?.folder || (automated ? 'archive' : 'inbox');
    const inboundEventId = `${parsed.eventId}:${mailbox.id}`;
    const { data: duplicate } = await db
      .from('communication_email_messages')
      .select('id')
      .eq('inbound_event_id', inboundEventId)
      .maybeSingle();
    async function notifyMembers() {
      const { data: members } = await db
        .from('communication_email_mailbox_members')
        .select('user_id')
        .eq('mailbox_id', mailbox.id);
      if (members?.length)
        await db.from('notifications').upsert(
          members.map((member: any) => ({
            user_id: member.user_id,
            type: 'message',
            title: 'New interoffice email',
            message: `${senderEmail}: ${subject}`,
            action_url: 'https://app.elevateforhumanity.org/communications/email',
            action_label: 'Read and reply',
            idempotency_key: `email:${inboundEventId}:${member.user_id}`,
            read: false,
          })),
          { onConflict: 'idempotency_key', ignoreDuplicates: true },
        );
    }
    if (duplicate) {
      await notifyMembers();
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
          folder: destination,
          custom_folder_id: folderId,
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
      reply_to: parseEmailList(parsed.replyTo)[0] || senderEmail,
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
        folder: destination,
        custom_folder_id: folderId,
      })
      .eq('id', thread.id);
    await notifyMembers();
    storedCount += 1;
  }

  if ((route || options.internalCopy) && storedCount + filteredCount !== mailboxes.length) {
    throw new Error('An assigned interoffice conversation copy could not be stored.');
  }
  return {
    stored: storedCount > 0,
    mailboxCount: storedCount,
    ...(filteredCount && !storedCount ? { filtered: true } : {}),
  };
}
