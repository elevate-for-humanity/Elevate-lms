import { processInterofficeOutbox } from './interoffice-outbox';
import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { sendEmail, type EmailAttachment } from '@/lib/email/sendgrid';
import {
  isActiveEmailProfile,
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
import {
  applicantConversationSubject,
  programConversationRoute,
} from './program-conversation-routing';
import { storeInboundCommunicationEmail } from './communication-inbound';
import { mailViewQuery, validateMailAction } from './mail-management';

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
  previewing: boolean;
  isAdmin: boolean;
};

export type CommunicationEmailApiOptions = {
  adminOversight?: boolean;
};

async function emailContext(
  options: CommunicationEmailApiOptions = {},
): Promise<EmailContext | NextResponse> {
  const db = await requireAdminClient();
  try {
    // The Admin and LMS apps can be on separate domains. A verified preview
    // handoff is sufficient for read-only mailbox inspection even when the LMS
    // domain has no Supabase session cookie.
    const handoffPreview = await resolvePortalPreviewSubject(db, null);
    const auth = await createClient();
    const {
      data: { user: authenticatedUser },
      error,
    } = await auth.auth.getUser();
    if ((error || !authenticatedUser) && !handoffPreview.previewing) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const preview = handoffPreview.previewing
      ? handoffPreview
      : await resolvePortalPreviewSubject(db, authenticatedUser?.id);
    const effectiveUserId = preview.previewing ? preview.userId : authenticatedUser!.id;

    if (options.adminOversight && !preview.previewing && authenticatedUser) {
      const [{ data: profile }, { data: userRoleRows }] = await Promise.all([
        db.from('profiles').select('role').eq('id', authenticatedUser.id).maybeSingle(),
        db.from('user_roles').select('roles(name),expires_at').eq('user_id', authenticatedUser.id),
      ]);
      const effectiveRoles = normalizeRoles([
        profile?.role,
        ...(userRoleRows ?? [])
          .filter((row: any) => !row.expires_at || new Date(row.expires_at).getTime() > Date.now())
          .map((row: any) => row.roles?.name),
      ]);
      if (effectiveRoles.some((role) => role === 'admin' || role === 'super_admin')) {
        const actorMailboxes = await ensureActorMailboxes(db, authenticatedUser.id);
        return {
          user: { id: authenticatedUser.id, email: authenticatedUser.email },
          db,
          mailboxes: actorMailboxes,
          previewing: false,
          isAdmin: true,
        };
      }
    }

    const [{ data: profile }, mailboxes] = await Promise.all([
      db.from('profiles').select('email').eq('id', effectiveUserId).maybeSingle(),
      ensureActorMailboxes(db, effectiveUserId),
    ]);
    return {
      user: { id: effectiveUserId, email: profile?.email || authenticatedUser?.email },
      db,
      mailboxes,
      previewing: preview.previewing,
      isAdmin: false,
    };
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

  const view = url.searchParams.get('view') || 'inbox';
  const search = (url.searchParams.get('q') || '').trim().slice(0, 160);
  let threadQuery = context.db
    .from('communication_email_threads')
    .select('id,subject,last_message_at,message_count,created_at,folder,custom_folder_id,starred')
    .eq('mailbox_id', selectedMailbox.id)
    .order('last_message_at', { ascending: false })
    .limit(500);
  threadQuery = mailViewQuery(threadQuery, view);
  if (view === 'sent') {
    const { data: sent, error } = await context.db
      .from('communication_email_messages')
      .select('thread_id')
      .eq('mailbox_id', selectedMailbox.id)
      .eq('direction', 'outbound')
      .limit(5000);
    if (error) return NextResponse.json({ error: 'Sent mail unavailable.' }, { status: 500 });
    threadQuery = threadQuery.in('id', [...new Set((sent || []).map((m: any) => m.thread_id))]);
  }
  if (search) {
    const needle = search.replace(/[,%_()]/g, ' ');
    const { data: matches, error: searchError } = await context.db
      .from('communication_email_messages')
      .select('thread_id')
      .eq('mailbox_id', selectedMailbox.id)
      .or(`subject.ilike.%${needle}%,text_body.ilike.%${needle}%,sender_email.ilike.%${needle}%`)
      .limit(1000);
    if (searchError) return NextResponse.json({ error: 'Search unavailable.' }, { status: 500 });
    threadQuery = threadQuery.in('id', [...new Set((matches || []).map((m: any) => m.thread_id))]);
  }
  const { data: threadRows, error: threadError } = await threadQuery;
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

  const [
    { data: folders, error: folderError },
    { data: drafts, error: draftError },
    { data: filters, error: filterError },
  ] = await Promise.all([
    context.db
      .from('communication_email_folders')
      .select('id,name')
      .eq('mailbox_id', selectedMailbox.id)
      .order('name'),
    context.db
      .from('communication_email_drafts')
      .select('id,thread_id,to_text,cc_text,bcc_text,subject,body,updated_at')
      .eq('mailbox_id', selectedMailbox.id)
      .eq('user_id', context.user.id)
      .order('updated_at', { ascending: false }),
    context.db
      .from('communication_email_filters')
      .select('id,field,contains,action,folder_id,enabled')
      .eq('mailbox_id', selectedMailbox.id)
      .order('created_at'),
  ]);
  if (folderError || draftError || filterError)
    return NextResponse.json({ error: 'Mail folders could not be loaded.' }, { status: 500 });
  const selectedThreadId = url.searchParams.get('threadId');
  const selectedThread = selectedThreadId
    ? (threadRows ?? []).find((thread: any) => thread.id === selectedThreadId)
    : null;
  let messages: any[] = [];
  if (selectedThread) {
    const { data: messageRows, error: messageError } = await context.db
      .from('communication_email_messages')
      .select(
        'id,direction,status,sender_email,sender_name,reply_to,to_addresses,cc_addresses,subject,text_body,sent_at,received_at,created_at,attachments:communication_email_attachments(id,file_name,mime_type,size_bytes)',
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
    filters: filters || [],
    folders: folders || [],
    drafts: drafts || [],
    view,
    selectedMailboxId: selectedMailbox.id,
    threads: (threadRows ?? []).map((thread: any) => ({
      ...thread,
      unread:
        !readAtByThread.get(thread.id) ||
        new Date(readAtByThread.get(thread.id)).getTime() <
          new Date(thread.last_message_at).getTime(),
    })),
    selectedThread: selectedThread ? { ...selectedThread, messages } : null,
    readOnly: context.previewing,
    isAdmin: context.isAdmin,
    meetings: context.isAdmin
      ? (
          await context.db
            .from('communication_rooms')
            .select('id,title,scheduled_at')
            .eq('host_profile_id', context.user.id)
            .in('status', ['open', 'scheduled'])
            .order('created_at', { ascending: false })
            .limit(25)
        ).data || []
      : [],
    directory: context.isAdmin
      ? (
          await context.db
            .from('communication_email_mailboxes')
            .select('id,address,display_name,mailbox_kind')
            .eq('active', true)
            .order('display_name')
        ).data || []
      : context.mailboxes
          .map((m) => ({
            id: m.id,
            address: m.address,
            display_name: m.displayName,
            mailbox_kind: m.mailboxKind,
          }))
          .concat([
            {
              id: 'admin',
              address: 'admissions@elevateforhumanity.org',
              display_name: 'Elevate Admin',
              mailbox_kind: 'department',
            },
          ]),
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

async function inviteEmailMeetings(
  context: EmailContext,
  text: string,
  recipientEmails: string[],
  profileIds: string[] = [],
) {
  if (!context.isAdmin) return;
  const ids = [
    ...new Set(
      Array.from(
        text.matchAll(/https:\/\/app\.elevateforhumanity\.org\/lms\/meetings\/([0-9a-f-]{36})/gi),
        (m) => m[1],
      ),
    ),
  ];
  if (!ids.length) return;
  const rooms = await context.db
    .from('communication_rooms')
    .select('id')
    .eq('host_profile_id', context.user.id)
    .in('id', ids)
    .in('status', ['open', 'scheduled']);
  if (rooms.error) throw Error('Meeting invitations unavailable');
  const boxes = await context.db
    .from('communication_email_mailboxes')
    .select('id')
    .eq('active', true)
    .in('address', recipientEmails);
  const members = await context.db
    .from('communication_email_mailbox_members')
    .select('user_id')
    .in(
      'mailbox_id',
      (boxes.data || []).map((m: any) => m.id),
    );
  const direct = await context.db.from('profiles').select('id').in('email', recipientEmails);
  const users = [
    ...new Set([
      ...profileIds,
      ...(members.data || []).map((m: any) => m.user_id),
      ...(direct.data || []).map((p: any) => p.id),
    ]),
  ];
  if (!users.length) return;
  const profiles = await context.db
    .from('profiles')
    .select('id,email,full_name,is_active,status')
    .in('id', users);
  if (profiles.error || boxes.error || members.error || direct.error)
    throw Error('Meeting invitees unavailable');
  for (const room of rooms.data || []) {
    const existing = await context.db
      .from('communication_room_participants')
      .select('profile_id')
      .eq('room_id', room.id);
    if (existing.error) throw Error('Meeting invitations unavailable');
    const already = new Set((existing.data || []).map((p: any) => p.profile_id));
    const rows = (profiles.data || [])
      .filter(
        (p: any) =>
          !already.has(p.id) &&
          isActiveEmailProfile({
            email: p.email,
            fullName: p.full_name,
            isActive: p.is_active,
            status: p.status,
          }),
      )
      .map((p: any) => ({
        room_id: room.id,
        profile_id: p.id,
        email: p.email,
        display_name: p.full_name || p.email,
        role: 'participant',
        invite_status: 'sent',
      }));
    if (rows.length) {
      const saved = await context.db.from('communication_room_participants').insert(rows);
      if (saved.error) throw Error('Meeting invitation could not be saved');
    }
  }
}

export async function handleCommunicationEmailPost(
  request: Request,
  options: CommunicationEmailApiOptions = {},
) {
  const context = await emailContext(options);
  if (context instanceof NextResponse) return context;
  if (context.previewing) {
    return NextResponse.json(
      {
        error:
          'Administrator portal previews are read-only. Sign in as the Program Holder to send email.',
      },
      { status: 403 },
    );
  }
  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Invalid email request.' }, { status: 400 });

  const mailbox = mailboxFor(context, String(form.get('mailboxId') || ''));
  if (!mailbox)
    return NextResponse.json({ error: 'Active mailbox access is required.' }, { status: 403 });

  const broadcast = form.get('broadcast') === 'true';
  if (broadcast) {
    if (!context.isAdmin)
      return NextResponse.json(
        { error: 'Only administrators may email everyone.' },
        { status: 403 },
      );
    if (form.getAll('attachments').some((f) => f instanceof File && f.size))
      return NextResponse.json(
        { error: 'Email everyone supports text messages. Send files individually.' },
        { status: 400 },
      );
    const subject = cleanEmailSubject(form.get('subject'));
    const body = String(form.get('body') || '')
      .trim()
      .slice(0, 100000);
    const campaign = String(form.get('campaignKey') || '').trim();
    if (!body || !/^[a-zA-Z0-9_-]{8,100}$/.test(campaign))
      return NextResponse.json(
        { error: 'Message and campaign identifier required.' },
        { status: 400 },
      );
    // NULL status means active too. Use the authoritative mailbox membership list as the audience.
    const members = await context.db
      .from('communication_email_mailbox_members')
      .select('user_id,communication_email_mailboxes!inner(active)')
      .eq('communication_email_mailboxes.active', true);
    if (members.error)
      return NextResponse.json({ error: 'Audience unavailable.' }, { status: 503 });
    const users = await context.db
      .from('profiles')
      .select('id,email,full_name,is_active,status,role')
      .in('id', [...new Set((members.data || []).map((m: any) => m.user_id))]);
    if (users.error) return NextResponse.json({ error: 'Audience unavailable.' }, { status: 503 });
    const unique = new Map<string, any>();
    for (const p of users.data || []) {
      if (
        isActiveEmailProfile({
          email: p.email,
          fullName: p.full_name,
          isActive: p.is_active,
          status: p.status,
        }) &&
        parseEmailList(p.email).length
      )
        unique.set(p.email.toLowerCase(), p);
    }
    const rows = [...unique.values()].map((p) => ({
      campaign_key: campaign,
      user_id: p.id,
      recipient_email: p.email,
      mailbox_id: mailbox.id,
      subject,
      body,
    }));
    await inviteEmailMeetings(
      context,
      body,
      [...unique.keys()],
      [...unique.values()].map((p) => p.id),
    );
    const queued = await context.db
      .from('communication_email_outbox')
      .upsert(rows, { onConflict: 'campaign_key,recipient_email', ignoreDuplicates: true });
    if (queued.error)
      return NextResponse.json({ error: 'Broadcast could not be queued.' }, { status: 500 });
    await context.db.from('notifications').upsert(
      [...unique.values()].map((p) => ({
        user_id: p.id,
        type: 'message',
        title: subject,
        message: body.slice(0, 1000),
        action_url: 'https://app.elevateforhumanity.org/communications/email',
        action_label: 'Open interoffice email',
        idempotency_key: `${campaign}:${p.id}`,
        read: false,
      })),
      { onConflict: 'idempotency_key', ignoreDuplicates: true },
    );
    return NextResponse.json({ ok: true, queued: rows.length });
  }
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

  await inviteEmailMeetings(context, bodyText, [...to, ...cc, ...bcc]);
  const route =
    !bcc.length && !cc.length
      ? await programConversationRoute(context.db, to, [mailbox.address])
      : null;
  const replyTo = route?.replyTo || mailbox.address;

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
        normalized_subject:
          to.length === 1 && !cc.length && !bcc.length
            ? applicantConversationSubject(subject, route?.applicantEmail || to[0])
            : normalizeEmailSubject(subject),
        message_count: 0,
      })
      .select('id,subject,message_count')
      .single();
    if (error || !data)
      return NextResponse.json({ error: 'Conversation could not be created.' }, { status: 500 });
    thread = data;
  }

  const draftId = String(form.get('draftId') || '').trim();
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
    reply_to: replyTo,
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
    replyTo,
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
  if (draftId) {
    await context.db
      .from('communication_email_drafts')
      .delete()
      .eq('id', draftId)
      .eq('mailbox_id', mailbox.id)
      .eq('user_id', context.user.id);
  }
  if (route) {
    const copyAddresses = route.addresses.filter((address) => address !== mailbox.address);
    let copies: { mailboxCount: number } | null = null;
    try {
      copies = await storeInboundCommunicationEmail(
        {
          from: `${safeMailboxDisplayName(mailbox.displayName)} <${mailbox.address}>`,
          to: copyAddresses.join(','),
          envelopeRecipients: copyAddresses,
          replyTo: route.applicantEmail,
          subject,
          text: bodyText,
          html: htmlBody,
          eventId: `interoffice-outbound:${messageId}`,
          attachments: files,
        },
        { applicantEmail: route.applicantEmail, internalCopy: true },
      );
    } catch {
      // Sending already succeeded. Report the copy failure without inviting a duplicate send.
    }
    if (copies?.mailboxCount !== copyAddresses.length) {
      return NextResponse.json({
        ok: true,
        threadId: thread.id,
        messageId,
        warning:
          'Email sent, but an interoffice copy could not be saved. Do not resend; contact admin.',
      });
    }
  }
  return NextResponse.json({ ok: true, threadId: thread.id, messageId });
}

export async function handleCommunicationEmailPatch(
  request: Request,
  options: CommunicationEmailApiOptions = {},
) {
  const context = await emailContext(options);
  if (context instanceof NextResponse) return context;
  if (context.previewing) {
    return NextResponse.json(
      { error: 'Administrator portal previews are read-only.' },
      { status: 403 },
    );
  }
  const body = await request.json().catch(() => ({}));
  if (body.action === 'sendQueued') {
    if (!context.isAdmin || !context.mailboxes.length)
      return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
    return NextResponse.json({ ok: true, ...(await processInterofficeOutbox()) });
  }
  if (body.action) {
    const problem = validateMailAction(body);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    const mailbox = mailboxFor(context, String(body.mailboxId || ''));
    if (!mailbox) return NextResponse.json({ error: 'Mailbox access required.' }, { status: 403 });
    const ok = (error: unknown) =>
      error
        ? NextResponse.json({ error: 'Mailbox update failed.' }, { status: 500 })
        : NextResponse.json({ ok: true });
    const name = String(body.name || '').trim();
    if (body.action === 'createFilter') {
      if (body.filterAction === 'folder') {
        const { data: folder } = await context.db
          .from('communication_email_folders')
          .select('id')
          .eq('id', body.folderId)
          .eq('mailbox_id', mailbox.id)
          .maybeSingle();
        if (!folder) return NextResponse.json({ error: 'Folder not found.' }, { status: 404 });
      }
      const { error } = await context.db.from('communication_email_filters').insert({
        mailbox_id: mailbox.id,
        field: body.field,
        contains: String(body.contains).trim(),
        action: body.filterAction,
        folder_id: body.filterAction === 'folder' ? body.folderId : null,
      });
      return ok(error);
    }
    if (body.action === 'disableFilter') {
      const { data, error } = await context.db
        .from('communication_email_filters')
        .update({ enabled: false })
        .eq('id', body.filterId)
        .eq('mailbox_id', mailbox.id)
        .select('id');
      if (!error && !data?.length)
        return NextResponse.json({ error: 'Filter not found.' }, { status: 404 });
      return ok(error);
    }
    if (body.action === 'createFolder') {
      const { error } = await context.db
        .from('communication_email_folders')
        .insert({ mailbox_id: mailbox.id, name });
      return ok(error);
    }
    if (body.action === 'renameFolder' || body.action === 'deleteFolder') {
      const { data: folder } = await context.db
        .from('communication_email_folders')
        .select('id')
        .eq('id', body.folderId)
        .eq('mailbox_id', mailbox.id)
        .maybeSingle();
      if (!folder) return NextResponse.json({ error: 'Folder not found.' }, { status: 404 });
      if (body.action === 'renameFolder') {
        const { error } = await context.db
          .from('communication_email_folders')
          .update({ name })
          .eq('id', folder.id)
          .eq('mailbox_id', mailbox.id);
        return ok(error);
      }
      const { error: ruleError } = await context.db
        .from('communication_email_filters')
        .update({ enabled: false, action: 'archive', folder_id: null })
        .eq('mailbox_id', mailbox.id)
        .eq('folder_id', folder.id);
      if (ruleError) return ok(ruleError);
      const moved = await context.db
        .from('communication_email_threads')
        .update({ custom_folder_id: null, folder: 'inbox' })
        .eq('mailbox_id', mailbox.id)
        .eq('custom_folder_id', folder.id);
      if (moved.error) return ok(moved.error);
      const { error } = await context.db
        .from('communication_email_folders')
        .delete()
        .eq('id', folder.id)
        .eq('mailbox_id', mailbox.id);
      return ok(error);
    }
    if (body.action === 'saveDraft' || body.action === 'deleteDraft') {
      const draftId = String(body.draftId || '');
      if (draftId) {
        const { data: draft } = await context.db
          .from('communication_email_drafts')
          .select('id')
          .eq('id', draftId)
          .eq('mailbox_id', mailbox.id)
          .eq('user_id', context.user.id)
          .maybeSingle();
        if (!draft) return NextResponse.json({ error: 'Draft not found.' }, { status: 404 });
      }
      if (body.action === 'deleteDraft') {
        const { error } = await context.db
          .from('communication_email_drafts')
          .delete()
          .eq('id', draftId)
          .eq('mailbox_id', mailbox.id)
          .eq('user_id', context.user.id);
        return ok(error);
      }
      if (body.threadId) {
        const { data: thread } = await context.db
          .from('communication_email_threads')
          .select('id')
          .eq('id', body.threadId)
          .eq('mailbox_id', mailbox.id)
          .maybeSingle();
        if (!thread)
          return NextResponse.json({ error: 'Conversation not found.' }, { status: 404 });
      }
      const row = {
        mailbox_id: mailbox.id,
        user_id: context.user.id,
        thread_id: body.threadId || null,
        to_text: String(body.to || '').slice(0, 4000),
        cc_text: String(body.cc || '').slice(0, 4000),
        bcc_text: String(body.bcc || '').slice(0, 4000),
        subject: cleanEmailSubject(body.subject),
        body: String(body.body || '').slice(0, 100000),
        updated_at: new Date().toISOString(),
      };
      const query = draftId
        ? context.db
            .from('communication_email_drafts')
            .update(row)
            .eq('id', draftId)
            .eq('user_id', context.user.id)
            .eq('mailbox_id', mailbox.id)
        : context.db.from('communication_email_drafts').insert(row);
      const { data: draft, error } = await query.select('id').single();
      return error ? ok(error) : NextResponse.json({ ok: true, draftId: draft.id });
    }
    const ids: string[] = [...new Set<string>(body.threadIds)];
    const { data: threads, error: accessError } = await context.db
      .from('communication_email_threads')
      .select('id')
      .eq('mailbox_id', mailbox.id)
      .in('id', ids);
    if (accessError || threads?.length !== ids.length)
      return NextResponse.json({ error: 'Conversation access denied.' }, { status: 403 });
    if (body.action === 'read' || body.action === 'unread') {
      if (body.action === 'unread') {
        const { error } = await context.db
          .from('communication_email_thread_reads')
          .delete()
          .eq('user_id', context.user.id)
          .in('thread_id', ids);
        return ok(error);
      }
      const { error } = await context.db.from('communication_email_thread_reads').upsert(
        ids.map((id) => ({
          thread_id: id,
          user_id: context.user.id,
          read_at: new Date().toISOString(),
        })),
      );
      return ok(error);
    }
    if (body.action === 'move' && body.folderId) {
      const { data: folder } = await context.db
        .from('communication_email_folders')
        .select('id')
        .eq('id', body.folderId)
        .eq('mailbox_id', mailbox.id)
        .maybeSingle();
      if (!folder) return NextResponse.json({ error: 'Folder not found.' }, { status: 404 });
    }
    const values =
      body.action === 'star'
        ? { starred: body.starred }
        : { folder: body.folder || 'inbox', custom_folder_id: body.folderId || null };
    const { error } = await context.db
      .from('communication_email_threads')
      .update(values)
      .eq('mailbox_id', mailbox.id)
      .in('id', ids);
    return ok(error);
  }
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
