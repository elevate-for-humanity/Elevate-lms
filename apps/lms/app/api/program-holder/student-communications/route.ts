// pre-auth-registry: exempt - requireProgramHolder validates the sender and holder-scoped enrollment.
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { hydrateProcessEnv } from '@/lib/secrets';

export async function POST(request: Request) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder') return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const enrollmentId = String(body.enrollmentId || '');
  const channel = String(body.channel || '');
  const subject = String(body.subject || '').trim().slice(0, 160);
  const message = String(body.message || '').trim().slice(0, 2000);
  if (!enrollmentId || !['email','sms'].includes(channel) || !message) {
    return NextResponse.json({ error: 'Student, channel, and message are required.' }, { status: 400 });
  }

  const { data: student } = await ctx.db
    .from('program_enrollments')
    .select('id,user_id,full_name,email,phone,program_holder_id')
    .eq('id', enrollmentId)
    .eq('program_holder_id', ctx.holderId)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: 'Student is not assigned to this Program Holder.' }, { status: 404 });

  await hydrateProcessEnv();
  let response: Response;
  if (channel === 'email') {
    if (!student.email) return NextResponse.json({ error: 'This student has no email address on file.' }, { status: 400 });
    const key = process.env.SENDGRID_API_KEY;
    if (!key) return NextResponse.json({ error: 'Email delivery is not configured.' }, { status: 503 });
    response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: student.email }] }],
        from: { email: 'info@elevateforhumanity.org', name: 'Elevate for Humanity' },
        reply_to: { email: ctx.profile.email || 'elevate4humanityedu@gmail.com' },
        subject: subject || 'Message from your HVAC Program Holder',
        content: [{ type: 'text/plain', value: message }],
      }),
    });
  } else {
    if (!student.phone) return NextResponse.json({ error: 'This student has no mobile number on file.' }, { status: 400 });
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!sid || !token || !from) return NextResponse.json({ error: 'Text-message delivery is not configured.' }, { status: 503 });
    const form = new URLSearchParams({ To: student.phone, From: from, Body: message });
    response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
  }

  const sent = response.ok;
  await ctx.db.from('communications').insert({
    sender_id: ctx.user.id,
    recipient_id: student.user_id,
    subject: subject || null,
    body: message,
    type: channel,
    status: sent ? 'sent' : 'failed',
    sent_at: sent ? new Date().toISOString() : null,
    metadata: { program_holder_id: ctx.holderId, enrollment_id: student.id, recipient_name: student.full_name },
  });
  if (!sent) return NextResponse.json({ error: `${channel === 'email' ? 'Email' : 'Text message'} could not be delivered.` }, { status: 502 });
  return NextResponse.json({ ok: true, channel, student: student.full_name });
}
