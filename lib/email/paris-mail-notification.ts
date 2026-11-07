import type { SupabaseClient } from '@supabase/supabase-js';

/** Emit only after a terminal provider receipt is saved, once per member and message. */
export async function notifyParisMailResult(
  db: SupabaseClient,
  result: {
    messageId: string;
    mailboxId: string;
    mailboxAddress: string;
    recipient: string;
    subject: string;
    status: 'sent' | 'failed';
  },
) {
  const { data: members, error } = await db
    .from('communication_email_mailbox_members')
    .select('user_id')
    .eq('mailbox_id', result.mailboxId);
  if (error) throw Error('PARIS reply notification recipients unavailable');
  if (!members?.length) return;
  const sent = result.status === 'sent';
  const { error: notifyError } = await db.from('notifications').upsert(
    [...new Set(members.map((member) => member.user_id))].map((userId) => ({
      user_id: userId,
      type: 'message',
      title: sent ? 'PARIS replied to an email' : 'PARIS email reply failed',
      message: `${sent ? 'Sent to' : 'Could not send to'} ${result.recipient} · ${result.subject}`,
      action_url: `https://app.elevateforhumanity.org/communications/email?mailboxId=${encodeURIComponent(result.mailboxId)}`,
      action_label: 'Review conversation',
      read: false,
      idempotency_key: `email:paris-reply:${result.messageId}:${userId}`,
      metadata: {
        alert_kind: 'email',
        email_status: result.status,
        recipient: result.recipient,
        subject: result.subject,
        mailbox_address: result.mailboxAddress,
        message_id: result.messageId,
      },
    })),
    { onConflict: 'idempotency_key', ignoreDuplicates: true },
  );
  if (notifyError) throw Error('PARIS reply status saved, but notification needs retry');
}
