import { requireAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from './sendgrid';
import { parseEmailList, textToEmailHtml } from './communication-email';
import { canParisRespond } from './mail-filters';
import type { ParsedInboundEmail } from './sendgrid-inbound';

export const EMAIL_INTERVIEW_QUESTIONS = [
  'Which program would you like to start, and what interests you about that career?',
  'What training or work experience do you already have in this field? It is okay if you are starting with no experience.',
  'Would you like to start in January 2027, or are you requesting a different start month?',
  'Which days and times can you attend training and, if applicable, work with a host shop?',
  'What is your transportation plan for attending training or reaching your host shop?',
  'Do you already have a potential host shop or employer? If so, what is the business name?',
  'Would you like the admissions team to explain payment plans or review available funding options with you?',
  'What questions or practical support needs would you like the admissions team to address before you get started?',
];
export function interviewReply(text: string, current: number, started: boolean) {
  if (/\b(unsubscribe|stop emailing|not interested|withdraw|remove me)\b/i.test(text))
    return {
      closed: true,
      next: current,
      reply:
        'I recorded that you do not want to continue this email interview. Our admissions team can help if your plans change.',
    };
  const next = started ? Math.min(current + 1, EMAIL_INTERVIEW_QUESTIONS.length) : 0;
  return {
    closed: false,
    next,
    reply:
      next < EMAIL_INTERVIEW_QUESTIONS.length
        ? `${started ? 'Thank you. Your answer has been saved.' : 'I am PARIS, Elevate’s virtual admissions assistant. I can collect your interview answers here by email.'}\n\nQuestion ${next + 1} of ${EMAIL_INTERVIEW_QUESTIONS.length}: ${EMAIL_INTERVIEW_QUESTIONS[next]}\n\nReply with your answer. Admission, placement, payment arrangements, and funding are confirmed by staff separately.`
        : 'Thank you for completing your email interview. Your answers are ready for the admissions team to review. They will confirm your enrollment arrangements and start date. You can reply with any additional questions.',
  };
}

/** Only actual stored inbound messages in an enabled mailbox may trigger an automated reply. */
export async function respondToParisMail(parsed: ParsedInboundEmail) {
  if (!canParisRespond(parsed)) return { responded: false, reason: 'automated_or_internal' };
  const db = await requireAdminClient();
  const sender = parseEmailList(parsed.from)[0];
  const { data: inbox, error: inboxError } = await db
    .from('communication_email_mailboxes')
    .select('id,address')
    .eq('active', true)
    .eq('paris_enabled', true)
    .in('address', [
      ...parsed.envelopeRecipients,
      ...parseEmailList(parsed.to),
      'admissions@elevateforhumanity.org',
    ]);
  if (inboxError) throw new Error('PARIS mailbox settings unavailable');
  if (!inbox?.length) return { responded: false, reason: 'not_enabled' };
  const mailbox =
    inbox.find((m: any) => m.address === 'admissions@elevateforhumanity.org') || inbox[0];
  const { data: inbound } = await db
    .from('communication_email_messages')
    .select('id,thread_id')
    .eq('inbound_event_id', `${parsed.eventId}:${mailbox.id}`)
    .eq('direction', 'inbound')
    .maybeSingle();
  if (!inbound) return { responded: false, reason: 'filtered' };
  await db
    .from('onboarding_email_log')
    .update({ status: 'responded', responded_at: new Date().toISOString() })
    .ilike('applicant_email', sender)
    .in('status', ['sent', 'followed_up']);
  const responseEvent = `${parsed.eventId}:paris-mail`;
  const existing = await db
    .from('communication_email_messages')
    .select('status')
    .eq('inbound_event_id', responseEvent)
    .maybeSingle();
  if (existing.error) throw new Error('PARIS event lookup unavailable');
  if (existing.data)
    return { responded: existing.data.status === 'sent', reason: 'already_claimed' };
  const { data: app, error: appError } = await db
    .from('applications')
    .select('id,first_name,program_interest,status,interview_responses,interview_completed')
    .ilike('email', sender)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (appError) throw new Error('Applicant lookup unavailable');
  const text = (parsed.text || '')
    .split(/\nOn .*wrote:|\n[- ]*Original Message|\n>/)[0]
    .trim()
    .slice(0, 10000);
  let reply =
    'I am PARIS, Elevate’s virtual assistant. Your message is saved in the admin inbox for the team to review. You can reply here to keep the conversation together.';
  if (app && !app.interview_completed && app.status !== 'enrolled') {
    const prior = app.interview_responses || {};
    const interview = prior.email_interview || { started: false, current: 0, answers: [] };
    if (interview.closed) return { responded: false, reason: 'opted_out' };
    const outcome = interviewReply(text, Number(interview.current || 0), !!interview.started);
    const answers =
      interview.started && text
        ? [
            ...(interview.answers || []),
            {
              question: EMAIL_INTERVIEW_QUESTIONS[interview.current],
              answer: text,
              event_id: parsed.eventId,
              received_at: new Date().toISOString(),
            },
          ]
        : interview.answers || [];
    const { error } = await db
      .from('applications')
      .update({
        interview_responses: {
          ...prior,
          email_interview: {
            started: true,
            current: outcome.next,
            answers,
            closed: outcome.closed,
          },
        },
        next_step: outcome.closed
          ? 'Staff review: applicant declined email interview'
          : outcome.next === EMAIL_INTERVIEW_QUESTIONS.length
            ? 'Staff review: email interview complete'
            : `PARIS email interview: awaiting question ${outcome.next + 1}`,
      })
      .eq('id', app.id);
    if (error) throw new Error('Interview answer could not be saved');
    reply = outcome.reply;
    if (!interview.started && !outcome.closed)
      reply += `\n\nContinue your program signup: https://www.elevateforhumanity.org/apply?program=${encodeURIComponent(app.program_interest || '')}`;
  }
  const subject = /^re:/i.test(parsed.subject) ? parsed.subject : `Re: ${parsed.subject}`;
  const { data: record, error: recordError } = await db
    .from('communication_email_messages')
    .insert({
      mailbox_id: mailbox.id,
      thread_id: inbound.thread_id,
      inbound_event_id: responseEvent,
      direction: 'outbound',
      status: 'pending',
      sender_email: mailbox.address,
      sender_name: 'PARIS — Elevate Virtual Assistant',
      to_addresses: [sender],
      reply_to: mailbox.address,
      subject,
      text_body: reply,
      html_body: textToEmailHtml(reply),
    })
    .select('id')
    .single();
  if (recordError || !record) return { responded: false, reason: 'already_claimed_or_failed' };
  const sent = await sendEmail({
    to: sender,
    from: `PARIS — Elevate Virtual Assistant <${mailbox.address}>`,
    replyTo: mailbox.address,
    subject,
    text: reply,
    html: textToEmailHtml(reply),
  });
  const now = new Date().toISOString();
  const { error: savedError } = await db
    .from('communication_email_messages')
    .update({
      status: sent.success ? 'sent' : 'failed',
      provider_message_id: sent.data?.messageId || null,
      sent_at: sent.success ? now : null,
      error_message: sent.error || null,
    })
    .eq('id', record.id);
  if (savedError) throw new Error('PARIS delivery receipt could not be saved');
  // Use a count query so concurrent staff replies cannot overwrite the counter.
  const receipt = await db
    .from('communication_email_messages')
    .select('id', { count: 'exact', head: true })
    .eq('thread_id', inbound.thread_id);
  await db
    .from('communication_email_threads')
    .update({ last_message_at: now, message_count: receipt.count || 1, updated_at: now })
    .eq('id', inbound.thread_id);
  return { responded: sent.success, reason: sent.success ? 'sent' : 'delivery_failed' };
}
