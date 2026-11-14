// pre-auth-registry: exempt - requireProgramHolder validates the sender and holder-scoped enrollment.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { sendEmail } from '@/lib/email/sendgrid';
import { smsService } from '@/lib/notifications/sms';

export async function POST(request: Request) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder')
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const enrollmentId = String(body.enrollmentId || '');
  const channel = String(body.channel || '');
  const subject = String(body.subject || '')
    .trim()
    .slice(0, 160);
  const message = String(body.message || '')
    .trim()
    .slice(0, 2000);
  if (!enrollmentId || !['email', 'sms'].includes(channel) || !message) {
    return NextResponse.json(
      { error: 'Student, channel, and message are required.' },
      { status: 400 },
    );
  }

  const { data: student } = await ctx.db
    .from('program_enrollments')
    .select('id,user_id,full_name,email,phone,program_holder_id')
    .eq('id', enrollmentId)
    .eq('program_holder_id', ctx.holderId)
    .maybeSingle();
  if (!student)
    return NextResponse.json(
      { error: 'Student is not assigned to this Program Holder.' },
      { status: 404 },
    );

  let sent = false;
  if (channel === 'email') {
    if (!student.email)
      return NextResponse.json(
        { error: 'This student has no email address on file.' },
        { status: 400 },
      );
    const result = await sendEmail({
      to: student.email,
      replyTo: ctx.profile.email || undefined,
      subject: subject || 'Message from your Program Holder',
      text: message,
      html: `<p>${message.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('\n', '<br />')}</p>`,
    });
    sent = result.success;
  } else {
    if (!student.phone)
      return NextResponse.json(
        { error: 'This student has no mobile number on file.' },
        { status: 400 },
      );
    if (body.consentConfirmed !== true)
      return NextResponse.json({ error: 'Confirm that this student consented to operational texts.' }, { status: 400 });
    const result = await smsService.send({ to: student.phone, message, metadata: {
      source: 'program_holder_student_communications', enrollment_id: enrollmentId,
      sent_by_user_id: ctx.user.id, consent_confirmed: true,
    } });
    sent = result.success;
  }

  await ctx.db.from('communications').insert({
    sender_id: ctx.user.id,
    recipient_id: student.user_id,
    subject: subject || null,
    body: message,
    type: channel,
    status: sent ? 'sent' : 'failed',
    sent_at: sent && channel === 'email' ? new Date().toISOString() : null,
    metadata: {
      program_holder_id: ctx.holderId,
      enrollment_id: student.id,
      recipient_name: student.full_name,
      delivery: channel === 'sms' && sent ? 'provider_accepted' : undefined,
    },
  });
  if (!sent)
    return NextResponse.json(
      { error: `${channel === 'email' ? 'Email' : 'Text message'} could not be delivered.` },
      { status: 502 },
    );
  return NextResponse.json({ ok: true, channel, student: student.full_name, delivery: channel === 'sms' ? 'queued' : 'sent' });
}
