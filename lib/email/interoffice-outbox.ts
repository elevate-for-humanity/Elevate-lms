import { storeInboundCommunicationEmail } from './communication-inbound';
import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from './sendgrid';
import { safeMailboxDisplayName, textToEmailHtml } from './communication-email';
import { applicantConversationSubject } from './program-conversation-routing';
export async function processInterofficeOutbox(limit = 20) {
  const db = await requireAdminClient();
  const { data: rows, error } = await db
    .from('communication_email_outbox')
    .select('*')
    .eq('status', 'pending')
    .order('created_at')
    .limit(limit);
  if (error) throw new Error('Email queue unavailable');
  let sent = 0,
    failed = 0;
  for (const row of rows || []) {
    const claimed = await db
      .from('communication_email_outbox')
      .update({ status: 'processing' })
      .eq('id', row.id)
      .eq('status', 'pending')
      .select('id');
    if (claimed.error || !claimed.data?.length) continue;
    const { data: mailbox } = await db
      .from('communication_email_mailboxes')
      .select('address,display_name')
      .eq('id', row.mailbox_id)
      .eq('active', true)
      .single();
    if (!mailbox) {
      await db
        .from('communication_email_outbox')
        .update({ status: 'failed', error_message: 'Sending mailbox unavailable' })
        .eq('id', row.id);
      failed++;
      continue;
    }
    const displayName = safeMailboxDisplayName(mailbox.display_name);
    const { data: thread, error: threadError } = await db
      .from('communication_email_threads')
      .insert({
        mailbox_id: row.mailbox_id,
        subject: row.subject,
        normalized_subject: applicantConversationSubject(row.subject, row.recipient_email),
        message_count: 0,
      })
      .select('id')
      .single();
    if (threadError || !thread) {
      await db
        .from('communication_email_outbox')
        .update({ status: 'failed', error_message: 'Conversation unavailable; email not sent' })
        .eq('id', row.id);
      failed++;
      continue;
    }
    const { data: record, error: recordError } = await db
      .from('communication_email_messages')
      .insert({
        mailbox_id: row.mailbox_id,
        thread_id: thread.id,
        inbound_event_id: `outbox:${row.id}`,
        direction: 'outbound',
        status: 'pending',
        sender_email: mailbox.address,
        sender_name: displayName,
        to_addresses: [row.recipient_email],
        reply_to: mailbox.address,
        subject: row.subject,
        text_body: row.body,
        html_body: textToEmailHtml(row.body),
      })
      .select('id')
      .single();
    if (recordError || !record) {
      await db
        .from('communication_email_outbox')
        .update({ status: 'failed', error_message: 'Message unavailable; email not sent' })
        .eq('id', row.id);
      failed++;
      continue;
    }
    const result = await sendEmail({
      singleAttempt: true,
      to: row.recipient_email,
      from: `${displayName} <${mailbox.address}>`,
      replyTo: mailbox.address,
      subject: row.subject,
      text: row.body,
      html: textToEmailHtml(row.body),
    });
    const now = new Date().toISOString();
    const receipt = {
      status: result.success ? 'sent' : 'failed',
      provider_message_id: result.data?.messageId || null,
      error_message: result.error || null,
      sent_at: result.success ? now : null,
    };
    await db.from('communication_email_outbox').update(receipt).eq('id', row.id);
    await db.from('communication_email_messages').update(receipt).eq('id', record.id);
    await db
      .from('communication_email_threads')
      .update({ message_count: 1, last_message_at: now })
      .eq('id', thread.id);
    if (result.success && row.user_id) {
      const membership = await db
        .from('communication_email_mailbox_members')
        .select('mailbox_id')
        .eq('user_id', row.user_id);
      const targets = await db
        .from('communication_email_mailboxes')
        .select('address')
        .eq('active', true)
        .in(
          'id',
          (membership.data || []).map((m: any) => m.mailbox_id),
        )
        .neq('mailbox_kind', 'department');
      const addresses = (targets.data || []).map((m: any) => m.address);
      if (addresses.length)
        await storeInboundCommunicationEmail(
          {
            from: `${displayName} <${mailbox.address}>`,
            to: addresses.join(', '),
            replyTo: mailbox.address,
            subject: row.subject,
            text: row.body,
            html: textToEmailHtml(row.body),
            envelopeRecipients: addresses,
            eventId: `outbox-copy:${row.campaign_key}`,
            attachments: [],
            headers: '',
          },
          { internalCopy: true },
        );
    }
    if (result.success) sent++;
    else failed++;
  }
  return { sent, failed, processed: (rows || []).length };
}

/** Remind only people who explicitly began an email interview and have not opted out. */
export async function queueInterviewFollowups() {
  const db = await requireAdminClient();
  const { data: apps, error } = await db
    .from('applications')
    .select('id,email,first_name,interview_responses,interview_completed,status')
    .not('interview_responses', 'is', null)
    .limit(2000);
  if (error) throw Error('Interview follow-up audience unavailable');
  const { data: mailbox } = await db
    .from('communication_email_mailboxes')
    .select('id')
    .eq('address', 'admissions@elevateforhumanity.org')
    .eq('active', true)
    .eq('paris_enabled', true)
    .maybeSingle();
  if (!mailbox) return { queued: 0 };
  let queued = 0;
  for (const app of apps || []) {
    const interview = app.interview_responses?.email_interview;
    if (
      !interview?.started ||
      interview.closed ||
      app.interview_completed ||
      app.status === 'enrolled' ||
      interview.current >= 8
    )
      continue;
    const { data: last } = await db
      .from('communication_email_messages')
      .select('id,created_at,subject,text_body')
      .eq('sender_name', 'PARIS — Elevate Virtual Assistant')
      .eq('status', 'sent')
      .contains('to_addresses', [app.email.toLowerCase()])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!last || Date.now() - new Date(last.created_at).getTime() < 48 * 60 * 60 * 1000) continue;
    const { data: reply } = await db
      .from('communication_email_messages')
      .select('id')
      .eq('sender_email', app.email.toLowerCase())
      .eq('direction', 'inbound')
      .gt('created_at', last.created_at)
      .limit(1)
      .maybeSingle();
    if (reply) continue;
    const { data: previous } = await db
      .from('communication_email_outbox')
      .select('id')
      .eq('campaign_key', `paris-followup-${last.id}`)
      .maybeSingle();
    if (previous) continue;
    const { error: queueError } = await db.from('communication_email_outbox').upsert(
      {
        campaign_key: `paris-followup-${last.id}`,
        recipient_email: app.email,
        mailbox_id: mailbox.id,
        subject: last.subject,
        body: `Hello ${app.first_name || 'there'},\n\nThis is PARIS following up on your email interview. Please reply when you are ready to continue.\n\n${last.text_body}\n\nIf you no longer wish to continue, reply “not interested.”`,
      },
      { onConflict: 'campaign_key,recipient_email', ignoreDuplicates: true },
    );
    if (queueError) throw Error('Follow-up could not be queued');
    queued++;
  }
  return { queued };
}
