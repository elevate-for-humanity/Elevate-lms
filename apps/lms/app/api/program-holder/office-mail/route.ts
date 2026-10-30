// pre-auth-registry: exempt - requireProgramHolder plus sender/recipient filters authorize access.
import { loadHolderOfficeStudents } from '@/lib/program-holder/office-students';
import { NextResponse } from 'next/server';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export async function GET() {
  const ctx = await requireProgramHolder();
  if (ctx.mode === 'admin')
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  try {
    const [messages, recipients, students] = await Promise.all([
      ctx.db
        .from('program_holder_office_messages')
        .select('id,sender_id,recipient_id,subject,body,read_at,created_at')
        .eq('program_holder_id', ctx.holderId)
        .or(`sender_id.eq.${ctx.user.id},recipient_id.eq.${ctx.user.id}`)
        .order('created_at', { ascending: false })
        .limit(100),
      ctx.db
        .from('profiles')
        .select('id,full_name,role')
        .in('role', ['admin', 'super_admin', 'staff'])
        .order('full_name'),
      loadHolderOfficeStudents(ctx),
    ]);
    if (messages.error || recipients.error) throw new Error('Office directory unavailable.');
    return NextResponse.json({
      readOnly: ctx.mode === 'preview',
      messages: messages.data ?? [],
      recipients: [
        ...(recipients.data ?? []),
        ...students
          .filter((student) => student.user_id)
          .map((student) => ({
            id: student.user_id,
            full_name: student.applicant_name,
            role: 'student',
          })),
      ],
    });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load office messages and recipients.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const ctx = await requireProgramHolder();
  if (ctx.mode !== 'holder')
    return NextResponse.json({ error: 'Program Holder session required.' }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const recipientId = String(body.recipientId || ''),
    subject = String(body.subject || '')
      .trim()
      .slice(0, 180),
    message = String(body.message || '')
      .trim()
      .slice(0, 5000);
  if (!recipientId || !subject || !message)
    return NextResponse.json(
      { error: 'Recipient, subject, and message are required.' },
      { status: 400 },
    );
  const { data: recipient, error: recipientError } = await ctx.db
    .from('profiles')
    .select('id,role')
    .eq('id', recipientId)
    .in('role', ['admin', 'super_admin', 'staff'])
    .maybeSingle();
  if (recipientError)
    return NextResponse.json({ error: 'Office recipient could not be verified.' }, { status: 503 });
  if (!recipient) {
    try {
      const students = await loadHolderOfficeStudents(ctx);
      if (!students.some((student) => student.user_id === recipientId))
        return NextResponse.json(
          { error: 'Choose an assigned student or authorized office recipient.' },
          { status: 403 },
        );
    } catch {
      return NextResponse.json(
        { error: 'Assigned recipient could not be verified.' },
        { status: 503 },
      );
    }
  }
  const { data, error } = await ctx.db
    .from('program_holder_office_messages')
    .insert({
      program_holder_id: ctx.holderId,
      sender_id: ctx.user.id,
      recipient_id: recipientId,
      subject,
      body: message,
      reply_to_id: body.replyToId || null,
    })
    .select('id,created_at')
    .single();
  return error
    ? NextResponse.json({ error: 'Unable to send office message.' }, { status: 500 })
    : NextResponse.json({ message: data }, { status: 201 });
}
