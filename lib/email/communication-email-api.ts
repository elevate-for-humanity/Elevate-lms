import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail, type EmailAttachment } from '@/lib/email/sendgrid';
import {
  cleanEmailSubject,
  normalizeEmailSubject,
  parseEmailList,
  safeMailboxDisplayName,
  textToEmailHtml,
} from '@/lib/email/communication-email';
import {
  actorPrimaryMailbox,
  ensureActorMailboxes,
  type ActorMailbox,
} from '@/lib/email/communication-mailbox';
import { safeAttachmentName } from '@/lib/email/sendgrid-inbound';
import { normalizeRoles } from '@/lib/rbac/role-matrix';

const ATTACHMENT_BUCKET = 'communication-email-attachments';
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 20 * 1024 * 1024;
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

type EmailContext = {
  user: { id: string; email?: string };
  db: Awaited<ReturnType<typeof requireAdminClient>>;
  mailboxes: ActorMailbox[];
};

export type CommunicationEmailApiOptions = {
  adminOversight?: boolean;
};

async function emailContext(
  options: CommunicationEmailApiOptions = {},
): Promise<EmailContext | NextResponse> {
  const auth = await createClient();
  const {
    data: { user },
    error,
  } = await auth.auth.getUser();
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = await requireAdminClient();
  try {
    if (options.adminOversight) {
      const [{ data: profile }, { data: userRoleRows }] = await Promise.all([
        db.from('profiles').select('role').eq('id', user.id).maybeSingle(),
        db.from('user_roles').select('roles(name)').eq('user_id', user.id),
      ]);
      const effectiveRoles = normalizeRoles([
        profile?.role,
        ...(userRoleRows ?? []).map((row: any) => row.roles?.name),
      ]);
      if (effectiveRoles.some((role) => role === 'admin' || role === 'super_admin')) {
        const { data, error: mailboxError } = await db
          .from('communication_email_mailboxes')
          .select('id,address,display_name,mailbox_kind,active')
          .eq('active', true)
          .order('address');
        if (mailboxError) throw mailboxError;
        const mailboxes: ActorMailbox[] = (data ?? []).map((mailbox: any) => ({
          id: String(mailbox.id),
          address: String(mailbox.address),
          displayName: String(mailbox.display_name),
          mailboxKind: mailbox.mailbox_kind,
          active: true,
          accessLevel: 'manager',
        }));
        return { user: { id: user.id, email: user.email }, db, mailboxes };
      }
    }
    const mailboxes = await ensureActorMailboxes(db, user.id);
    return { user: { id: user.id, email: user.email }, db, mailboxes };
  } catch {
    return NextResponse.json({ error: 'Email accounts could not be loaded.' }, { status: 500 });
  }
}

function mailboxFor(context: EmailContext, mailboxId: string | null): ActorMailbox | null {
  if (!context.mailboxes.length) return null;
  if (mailboxId) return context.mailboxes.find((mailbox) => mailbox.id === mailboxId) ?? null;
  return actorPrimaryMailbox(context.mailboxes);
}

async function attachmentRedirect(context: EmailContext, attachmentId: string) {
  const { data: attachment } = await context.db
    .from('communication_email_attachments')
    .select('id,mailbox_id,storage_path')
    .eq('id', attachmentId)
    .maybeSingle();
  if (!attachment || !context.mailboxes.some((mailbox) => mailbox.id === attachment.mailbox_id)) {
    return NextResponse.json({ error: 'Attachment not found.' }, { status: 404 });
  }
  const { data, error } = await context.db.storage
    .from(ATTACHMENT_BUCKET)
    .createSignedUrl(attachment.storage_path, 60);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Attachment is unavailable.' }, { status: 503 });
  }
  return NextResponse.redirect(data.signedUrl);
}

export async function handleCommunicationEmailGet(
  request: Request,
  options: CommunicationEmailApiOptions = {},
) {
  const context = await emailContext(options);
  if (context instanceof NextResponse) return context;
  const url = new URL(request.url);
  const attachmentId = url.searchParams.get('attachmentId');
  if (attachmentId) return attachmentRedirect(context, attachmentId);

  const selectedMailbox = mailboxFor(context, url.searchParams.get('mailboxId'));
  if (!selectedMailbox) {
    return NextResponse.json({ mailboxes: [], threads: [], selectedMailboxId: null });
  }

  const { data: threadRows, error: threadError } = await context.db
    .from('communication_email_threads')
    .select('id,subject,last_message_at,message_count,created_at')
    .eq('mailbox_id', selectedMailbox.id)
    .order('last_message_at', { ascending: false })
    .limit(100);
  if (threadError)
    return NextResponse.json({ error: 'Inbox could not be loaded.' }, { status: 500 });

  const threadIds = (threadRows ?? []).map((thread: any) => thread.id);
  const { data: reads } = threadIds.length
    ? await context.db
        .from('communication_email_thread_reads')
        .select('thread_id,read_at')
        .eq('user_id', context.user.id)
        .in('thread_id', threadIds)
    : { data: [] as any[] };
  const readAtByThread = new Map((reads ?? []).map((read: any) => [read.thread_id, read.read_at]));

  const selectedThreadId = url.searchParams.get('threadId');
  const selectedThread = selectedThreadId
    ? (threadRows ?? []).find((thread: any) => thread.id === selectedThreadId)
    : null;
  let messages: any[] = [];
  if (selectedThread) {
    const { data: messageRows, error: messageError } = await context.db
      .from('communication_email_messages')
      .select(
        'id,direction,status,sender_email,sender_name,to_addresses,cc_addresses,subject,text_body,sent_at,received_at,created_at,attachments:communication_email_attachments(id,file_name,mime_type,size_bytes)',
      )
      .eq('mailbox_id', selectedMailbox.id)
      .eq('thread_id', selectedThread.id)
      .order('created_at', { ascending: true });
    if (messageError) {
      return NextResponse.json({ error: 'Conversation could not be loaded.' }, { status: 500 });
    }
    messages = messageRows ?? [];
  }

  return NextResponse.json({
    mailboxes: context.mailboxes,
    selectedMailboxId: selectedMailbox.id,
    threads: (threadRows ?? []).map((thread: any) => ({
      ...thread,
      unread:
        !readAtByThread.get(thread.id) ||
        new Date(readAtByThread.get(thread.id)).getTime() <
          new Date(thread.last_message_at).getTime(),
    })),
    selectedThread: selectedThread ? { ...selectedThread, messages } : null,
  });
}

function formFiles(form: FormData): File[] {
  return form
    .getAll('attachments')
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, 10);
}

async function validateFiles(files: File[]): Promise<string | null> {
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_TOTAL_ATTACHMENT_BYTES) return 'Attachments may not exceed 20 MB total.';
  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_BYTES) return `${file.name} exceeds the 10 MB file limit.`;
    if (!ALLOWED_ATTACHMENT_TYPES.has(file.type || 'application/octet-stream')) {
      return `${file.name} uses an unsupported file type.`;
    }
  }
  return null;
}

export async function handleCommunicationEmailPost(
  request: Request,
  options: CommunicationEmailApiOptions = {},
) {
  const context = await emailContext(options);
  if (context instanceof NextResponse) return context;
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Invalid email request.' }, { status: 400 });

  const mailbox = mailboxFor(context, String(form.get('mailboxId') || ''));
  if (!mailbox)
    return NextResponse.json({ error: 'Active mailbox access is required.' }, { status: 403 });

  const to = parseEmailList(form.get('to'));
  const cc = parseEmailList(form.get('cc'));
  const bcc = parseEmailList(form.get('bcc'));
  const bodyText = String(form.get('body') || '')
    .trim()
    .slice(0, 100_000);
  const requestedThreadId = String(form.get('threadId') || '').trim() || null;
  const files = formFiles(form);
  const fileError = await validateFiles(files);
  if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });
  if (!to.length)
    return NextResponse.json({ error: 'Add at least one valid recipient.' }, { status: 400 });
  if (!bodyText && !files.length) {
    return NextResponse.json({ error: 'Write a message or attach a file.' }, { status: 400 });
  }

  let thread: any = null;
  if (requestedThreadId) {
    const { data } = await context.db
      .from('communication_email_threads')
      .select('id,subject,message_count')
      .eq('id', requestedThreadId)
      .eq('mailbox_id', mailbox.id)
      .maybeSingle();
    thread = data;
    if (!thread) return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  }

  const subject = cleanEmailSubject(form.get('subject') || thread?.subject);
  if (!thread) {
    const { data, error } = await context.db
      .from('communication_email_threads')
      .insert({
        mailbox_id: mailbox.id,
        subject,
        normalized_subject: normalizeEmailSubject(subject),
        message_count: 0,
      })
      .select('id,subject,message_count')
      .single();
    if (error || !data)
      return NextResponse.json({ error: 'Conversation could not be created.' }, { status: 500 });
    thread = data;
  }

  const messageId = randomUUID();
  const htmlBody = textToEmailHtml(bodyText);
  const { error: messageError } = await context.db.from('communication_email_messages').insert({
    id: messageId,
    thread_id: thread.id,
    mailbox_id: mailbox.id,
    direction: 'outbound',
    status: 'pending',
    sender_email: mailbox.address,
    sender_name: safeMailboxDisplayName(mailbox.displayName),
    to_addresses: to,
    cc_addresses: cc,
    bcc_addresses: bcc,
    reply_to: mailbox.address,
    subject,
    text_body: bodyText,
    html_body: htmlBody,
    sent_by_user_id: context.user.id,
  });
  if (messageError)
    return NextResponse.json({ error: 'Email could not be queued.' }, { status: 500 });

  const providerAttachments: EmailAttachment[] = [];
  try {
    for (const file of files) {
      const content = Buffer.from(await file.arrayBuffer());
      const fileName = safeAttachmentName(file.name);
      const storagePath = `${mailbox.id}/${messageId}/${randomUUID()}-${fileName}`;
      const { error: uploadError } = await context.db.storage
        .from(ATTACHMENT_BUCKET)
        .upload(storagePath, content, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { error: attachmentError } = await context.db
        .from('communication_email_attachments')
        .insert({
          message_id: messageId,
          mailbox_id: mailbox.id,
          storage_path: storagePath,
          file_name: fileName,
          mime_type: file.type,
          size_bytes: file.size,
        });
      if (attachmentError) throw attachmentError;
      providerAttachments.push({
        content: content.toString('base64'),
        filename: fileName,
        type: file.type,
      });
    }
  } catch {
    await context.db
      .from('communication_email_messages')
      .update({ status: 'failed', error_message: 'Attachment storage failed.' })
      .eq('id', messageId);
    return NextResponse.json(
      { error: 'One or more attachments could not be stored.' },
      { status: 500 },
    );
  }

  const sendResult = await sendEmail({
    to: [...to, ...cc],
    bcc,
    from: `${safeMailboxDisplayName(mailbox.displayName)} <${mailbox.address}>`,
    replyTo: mailbox.address,
    subject,
    text: bodyText,
    html: htmlBody,
    attachments: providerAttachments,
  });
  const now = new Date().toISOString();
  await Promise.all([
    context.db
      .from('communication_email_messages')
      .update({
        status: sendResult.success ? 'sent' : 'failed',
        provider_message_id: sendResult.data?.messageId ?? null,
        error_message: sendResult.error ?? null,
        sent_at: sendResult.success ? now : null,
      })
      .eq('id', messageId),
    context.db
      .from('communication_email_threads')
      .update({
        last_message_at: now,
        message_count: Number(thread.message_count || 0) + 1,
        updated_at: now,
      })
      .eq('id', thread.id),
  ]);

  if (!sendResult.success) {
    return NextResponse.json(
      { error: 'SendGrid did not accept the email. The failed attempt is saved.' },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true, threadId: thread.id, messageId });
}

export async function handleCommunicationEmailPatch(
  request: Request,
  options: CommunicationEmailApiOptions = {},
) {
  const context = await emailContext(options);
  if (context instanceof NextResponse) return context;
  const body = await request.json().catch(() => ({}));
  const threadId = String(body.threadId || '');
  const { data: thread } = await context.db
    .from('communication_email_threads')
    .select('id,mailbox_id')
    .eq('id', threadId)
    .maybeSingle();
  if (!thread || !context.mailboxes.some((mailbox) => mailbox.id === thread.mailbox_id)) {
    return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
  }
  const { error } = await context.db.from('communication_email_thread_reads').upsert({
    thread_id: threadId,
    user_id: context.user.id,
    read_at: new Date().toISOString(),
  });
  if (error)
    return NextResponse.json({ error: 'Read status could not be saved.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
