import { NextResponse } from 'next/server';
import { phoneActorResponse } from './actor-response';
import { telnyxClient } from './telnyx';
export function smsNumber(value: unknown) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.length === 10
    ? `+1${digits}`
    : digits.length === 11 && digits.startsWith('1')
      ? `+${digits}`
      : null;
}
export async function smsGet() {
  const { actor: ctx, response } = await phoneActorResponse();
  if (response) return response;
  if (!ctx.system)
    return NextResponse.json({ error: 'No phone system assigned.' }, { status: 403 });
  let query = ctx.db
    .from('communication_sms_messages')
    .select('id,direction,from_number,to_number,body,status,error_message,created_at')
    .eq('phone_system_id', ctx.system.id)
    .order('created_at', { ascending: false })
    .limit(200);
  if (!ctx.roles.some((r) => ['admin', 'super_admin', 'org_admin'].includes(r)))
    query = query.eq('owner_profile_id', ctx.user.id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Texts could not be loaded.' }, { status: 503 });
  return NextResponse.json({ messages: data || [], readOnly: ctx.previewing });
}
export async function smsPost(request: Request) {
  const { actor: ctx, response } = await phoneActorResponse();
  if (response) return response;
  if (ctx.previewing || !ctx.system)
    return NextResponse.json({ error: 'An active phone account is required.' }, { status: 403 });
  const input = await request.json().catch(() => ({})),
    to = smsNumber(input.to),
    text = String(input.body || '').trim();
  if (
    !to ||
    !text ||
    text.length > 1600 ||
    !/^[0-9a-f-]{36}$/i.test(String(input.requestKey || ''))
  )
    return NextResponse.json(
      { error: 'Enter a US phone number and 1–1600 characters.' },
      { status: 400 },
    );
  const prior = await ctx.db
    .from('communication_sms_messages')
    .select('status')
    .eq('request_key', input.requestKey)
    .eq('owner_profile_id', ctx.user.id)
    .maybeSingle();
  if (prior.data)
    return NextResponse.json(
      {
        ok: ['accepted', 'sent', 'delivered'].includes(prior.data.status),
        status: prior.data.status,
        idempotent: true,
      },
      { status: prior.data.status === 'pending' ? 409 : 200 },
    );
  const { data: number } = await ctx.db
    .from('phone_numbers')
    .select('e164')
    .eq('phone_system_id', ctx.system.id)
    .eq('status', 'active')
    .eq('is_primary', true)
    .maybeSingle();
  if (!number)
    return NextResponse.json({ error: 'No active sending number is configured.' }, { status: 503 });
  const { data: record, error } = await ctx.db
    .from('communication_sms_messages')
    .insert({
      phone_system_id: ctx.system.id,
      owner_profile_id: ctx.user.id,
      direction: 'outbound',
      from_number: number.e164,
      to_number: to,
      body: text,
      request_key: input.requestKey,
      status: 'pending',
    })
    .select('id')
    .single();
  if (error || !record)
    return NextResponse.json({ error: 'Text could not be queued.' }, { status: 503 });
  try {
    const result = await (await telnyxClient()).messages.send({ from: number.e164, to, text });
    if (!result.data?.id) throw Error('Acceptance unconfirmed');
    const { error: saved } = await ctx.db
      .from('communication_sms_messages')
      .update({ status: 'accepted', provider_message_id: result.data.id })
      .eq('id', record.id);
    if (saved) throw Error('Receipt unavailable');
    return NextResponse.json({ ok: true, status: 'accepted' });
  } catch {
    await ctx.db
      .from('communication_sms_messages')
      .update({
        status: 'failed',
        error_message: 'SMS acceptance unconfirmed. Check the provider receipt before retrying.',
      })
      .eq('id', record.id);
    return NextResponse.json(
      {
        error: 'Text was not confirmed. Verify SMS activation and delivery status before retrying.',
      },
      { status: 502 },
    );
  }
}
