import { randomUUID } from 'node:crypto';
import { applyMailFilters, isGmailCopy, isRelevantCopy, isAutomatedMail } from './mail-filters';
import { requireAdminClient } from '@/lib/supabase/admin';
import { normalizeEmailSubject, parseEmailList } from '@/lib/email/communication-email';
import { inboundDeliveryRecipients, parseEnvelopeAddresses, safeAttachmentName, type ParsedInboundEmail } from '@/lib/email/sendgrid-inbound';
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
): Promise<{ stored: boolean; mailboxCount: number; filtered?: boolean; review?: boolean }> {
  const envelope = inboundDeliveryRecipients(parsed);

  const db = await requireAdminClient();
  const originalSender = parseEmailList(parsed.from)[0];
  const route = options.internalCopy || !envelope.length
    ? null
    : await programConversationRoute(db, [originalSender || ''], envelope);
  // Tagged business addresses alias the base mailbox when the exact address
  // has no mailbox. Never strip tags on another domain.
  const taggedAliases = new Map(envelope.flatMap((address) => {
    const alias = /^([^+@]+)\+[^@]+(@elevateforhumanity\.org)$/.exec(address);
    return alias ? [[address, alias[1] + alias[2]] as const] : [];
  }));
  const recipients = [...new Set([...envelope, ...taggedAliases.values(), ...(route?.addresses || [])])];
  const matched = recipients.length ? await db.from('communication_email_mailboxes')
    .select('id,address,mailbox_kind,program_holder_id')
    .in('address', recipients).eq('active', true) : { data: [], error: null };
  if (matched.error) throw new Error('Mail routing unavailable');
  const holderIds = [...new Set((matched.data || [])
    .filter((mailbox) => mailbox.mailbox_kind === 'program_holder' && mailbox.program_holder_id)
    .map((mailbox) => mailbox.program_holder_id))];
  let archivedHolderIds = new Set<string>();
  if (holderIds.length) {
    const holders = await db.from('program_holders').select('id,features').in('id', holderIds);
    if (holders.error) throw new Error('Archived mailbox routing check unavailable');
    archivedHolderIds = new Set((holders.data || [])
      .filter((holder: any) => holder.features?.portal_access_archived === true)
      .map((holder: any) => holder.id));
  }
  // Preserve archived history while keeping new deliveries out of archived mailboxes.
  const activeMailboxes = (matched.data || []).filter((mailbox) =>
    !(mailbox.mailbox_kind === 'program_holder' &&
      mailbox.program_holder_id && archivedHolderIds.has(mailbox.program_holder_id)));
  const activeAddresses = new Set(activeMailboxes.map((mailbox) => mailbox.address));
  const destinations = envelope.map((address) =>
    activeAddresses.has(address) ? address : taggedAliases.get(address) || address);
  const unresolved = envelope.filter((_, index) => !activeAddresses.has(destinations[index]));
  const mailboxes = activeMailboxes.filter((mailbox) =>
    destinations.includes(mailbox.address) || route?.addresses.includes(mailbox.address));
  const deliveries = mailboxes.map((mailbox) => ({ mailbox, review: false, reviewFolderId: null as string | null }));
  if (!options.internalCopy && (!envelope.length || unresolved.length)) {
    // Use the existing Admissions membership boundary for the routing review queue.
    const queue = await db.from('communication_email_mailboxes')
      .select('id,address,mailbox_kind,program_holder_id')
      .eq('address', 'admissions@elevateforhumanity.org').eq('active', true).single();
    if (queue.error || !queue.data) throw new Error('Routing review mailbox unavailable');
    const folder = await db.from('communication_email_folders')
      .upsert({ mailbox_id: queue.data.id, name: 'Routing Review' }, { onConflict: 'mailbox_id,name' })
      .select('id').single();
    if (folder.error || !folder.data) throw new Error('Routing review folder unavailable');
    deliveries.push({ mailbox: queue.data, review: true, reviewFolderId: folder.data.id });
  }
  if (!deliveries.length) return { stored: false, mailboxCount: 0 };

  const senderEmail = parseEmailList(parsed.from)[0];
  if (!senderEmail) return { stored: false, mailboxCount: 0 };
  const originalSubject =
    String(parsed.subject || '(no subject)')
      .replace(/[\r\n]+/g, ' ')
      .trim()
      .slice(0, 240) || '(no subject)';
  const applicantEmail = options.applicantEmail || route?.applicantEmail || originalSender;
  const textBody = textFromInbound(parsed);
  const visibleTo = parseEnvelopeAddresses(parsed.to);
  const visibleCc = parseEnvelopeAddresses(parsed.cc).filter((address) => !visibleTo.includes(address));
  let storedCount = 0;
  let filteredCount = 0;
  let queuedForReview = false;

  for (const { mailbox, review, reviewFolderId } of deliveries) {
    const subject = review ? `Routing error: ${originalSubject}`.slice(0, 240) : originalSubject;
    const normalizedSubject = review
      ? `routing-review:${parsed.deliveryId || parsed.eventId}`
      : applicantEmail
        ? applicantConversationSubject(subject, applicantEmail)
        : normalizeEmailSubject(subject);
    const { data: filters, error: filterError } = await db
      .from('communication_email_filters')
      .select('field,contains,action,folder_id,enabled')
      .eq('mailbox_id', mailbox.id)
      .order('created_at');
    if (filterError) throw new Error('Mail filters unavailable');
    const rule = options.internalCopy || review
      ? null
      : applyMailFilters(filters || [], { sender: senderEmail, subject, body: textBody });
    if (
      rule?.skip ||
      (!options.internalCopy && !review &&
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
      reviewFolderId || rule?.folderId || folders?.find((folder: any) => folder.name === suggested)?.id || null;
    const destination = review ? 'inbox' : rule?.folder || (automated ? 'archive' : 'inbox');
    const inboundEventId = review
      ? `review:${parsed.deliveryId || parsed.eventId}:${mailbox.id}`
      : `${parsed.eventId}:${mailbox.id}`;
    const { data: duplicate, error: duplicateError } = await db
      .from('communication_email_messages')
      .select('id,thread_id,status,received_at')
      .eq('inbound_event_id', inboundEventId)
      .maybeSingle();
    if (duplicateError) throw new Error('Mail deduplication unavailable');
    async function notifyMembers(threadId: string) {
      if (review) return;
      const { data: members } = await db
        .from('communication_email_mailbox_members')
        .select('user_id')
        .eq('mailbox_id', mailbox.id);
      if (members?.length)
        await db.from('notifications').upsert(
          members.map((member: any) => ({
            user_id: member.user_id,
            type: 'message',
            title: `New interoffice email · ${mailbox.address}`,
            message: `From ${senderEmail} · ${subject} · ${textBody.replace(/\s+/g, ' ').slice(0, 160)}`,
            action_url: `https://app.elevateforhumanity.org/communications/email?mailboxId=${encodeURIComponent(mailbox.id)}&threadId=${encodeURIComponent(threadId)}`,
            action_label: 'Read and reply',
            idempotency_key: `email:${inboundEventId}:${member.user_id}`,
            metadata: { alert_kind: 'email', sender_name: senderName(parsed.from), sender_email: senderEmail, subject, preview: textBody.replace(/\s+/g, ' ').slice(0, 180), mailbox_address: mailbox.address, mailbox_id: mailbox.id, thread_id: threadId },
            read: false,
          })),
          { onConflict: 'idempotency_key', ignoreDuplicates: true },
        );
    }
    if (duplicate?.status === 'received') {
      await notifyMembers(duplicate.thread_id);
      if (review) queuedForReview = true;
      else storedCount += 1;
      continue;
    }

    let threadId = duplicate?.thread_id;
    if (!threadId) {
      const { data: thread, error: threadError } = await db
        .from('communication_email_threads')
        .select('id')
        .eq('mailbox_id', mailbox.id)
        .eq('normalized_subject', normalizedSubject)
        .order('last_message_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (threadError) throw new Error('Mail conversation lookup failed');
      threadId = thread?.id;
    }
    if (!threadId) {
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
        .select('id')
        .single();
      if (created.error || !created.data) continue;
      threadId = created.data.id;
    }

    const messageId = duplicate?.id || randomUUID();
    const receivedAt = duplicate?.received_at || new Date().toISOString();
    if (!duplicate) {
      const { error: messageError } = await db.from('communication_email_messages').insert({
        id: messageId,
        thread_id: threadId,
        mailbox_id: mailbox.id,
        direction: 'inbound',
        status: 'pending',
        inbound_event_id: inboundEventId,
        sender_email: senderEmail,
        sender_name: senderName(parsed.from),
        to_addresses: visibleTo,
        cc_addresses: visibleCc,
        bcc_addresses: [],
        reply_to: parseEmailList(parsed.replyTo)[0] || senderEmail,
        subject,
        text_body: review
          ? `Unresolved delivery recipients: ${unresolved.join(', ') || '(missing recipient)'}\n\n${textBody}`
          : textBody,
        provider_message_id: parsed.providerMessageId?.slice(0, 255) || null,
        html_body: parsed.html || null,
        received_at: receivedAt,
      });
      if (messageError) continue;
    }

    for (const [index, file] of parsed.attachments.entries()) {
      if (
        file.size <= 0 ||
        file.size > MAX_ATTACHMENT_BYTES ||
        !ALLOWED_ATTACHMENT_TYPES.has(file.type)
      )
        continue;
      const fileName = safeAttachmentName(file.name);
      const storagePath = `${mailbox.id}/${messageId}/${index}-${fileName}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      const { error: uploadError } = await db.storage
        .from(ATTACHMENT_BUCKET)
        .upload(storagePath, bytes, { contentType: file.type, upsert: true });
      if (uploadError) throw new Error('Inbound attachment storage unavailable');
      const { error: attachmentError } = await db.from('communication_email_attachments').upsert({
        message_id: messageId,
        mailbox_id: mailbox.id,
        storage_path: storagePath,
        file_name: fileName,
        mime_type: file.type,
        size_bytes: file.size,
      }, { onConflict: 'storage_path', ignoreDuplicates: true });
      if (attachmentError) throw new Error('Inbound attachment record unavailable');
    }

    const { count, error: countError } = await db.from('communication_email_messages')
      .select('id', { count: 'exact', head: true }).eq('thread_id', threadId);
    if (countError) throw new Error('Mail conversation count unavailable');
    const { error: updateError } = await db.from('communication_email_threads')
      .update({
        last_message_at: receivedAt,
        message_count: count ?? 0,
        updated_at: receivedAt,
        folder: destination,
        custom_folder_id: folderId,
      })
      .eq('id', threadId)
      .lte('last_message_at', receivedAt);
    if (updateError) throw new Error('Mail conversation update failed');
    const { error: receivedError } = await db.from('communication_email_messages')
      .update({ status: 'received' }).eq('id', messageId);
    if (receivedError) throw new Error('Inbound message confirmation failed');

    await notifyMembers(threadId);
    if (review) queuedForReview = true;
    else storedCount += 1;
  }

  if (storedCount + filteredCount + Number(queuedForReview) !== deliveries.length) {
    throw new Error('An assigned interoffice conversation copy could not be stored.');
  }
  return {
    stored: storedCount > 0,
    mailboxCount: storedCount,
    ...(queuedForReview ? { review: true } : {}),
    ...(filteredCount && !storedCount ? { filtered: true } : {}),
  };
}
