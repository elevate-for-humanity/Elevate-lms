import { NextResponse } from 'next/server';
import { phoneActorResponse } from './actor-response';
import { sendTwilioMessage, SMS_MEDIA_BUCKET, type SmsMedia } from './twilio';
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
    .select('id,direction,from_number,to_number,body,media,status,error_message,created_at')
    .eq('phone_system_id', ctx.system.id)
    .order('created_at', { ascending: false })
    .limit(200);
  if (!ctx.roles.some((r) => ['admin', 'super_admin', 'org_admin'].includes(r)))
    query = query.eq('owner_profile_id', ctx.user.id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: 'Texts could not be loaded.' }, { status: 503 });
  const { data: sender } = await ctx.db.from('phone_numbers').select('provider,capabilities')
    .eq('phone_system_id', ctx.system.id).eq('is_primary', true).eq('status', 'active').maybeSingle();
  const sendingEnabled = sender?.provider === 'twilio' && sender?.capabilities?.sms === true;
  return NextResponse.json({ messages: data || [], readOnly: ctx.previewing, sendingEnabled,
    messagingNotice: sendingEnabled ? '' : 'Outbound texts and pictures are awaiting carrier registration and activation.' });
}
export async function smsPost(request: Request) {
  const { actor: ctx, response } = await phoneActorResponse();
  if (response) return response;
  if (ctx.previewing || !ctx.system)
    return NextResponse.json({ error: 'An active phone account is required.' }, { status: 403 });
  if (Number(request.headers.get('content-length') || '0') > 5 * 1024 * 1024)
    return NextResponse.json({ error: 'Choose a picture smaller than 3 MB.' }, { status: 413 });
  const form = request.headers.get('content-type')?.startsWith('multipart/form-data')
    ? await request.formData().catch(() => null) : null;
  const input = form ? Object.fromEntries(form.entries()) : await request.json().catch(() => ({})),
    to = smsNumber(input.to),
    text = String(input.body || '').trim();
  const picture = form?.get('picture');
  const file = picture && typeof picture !== 'string' && picture.size ? picture : null;
  if (
    !to ||
    (!text && !file) ||
    text.length > 1600 ||
    !/^[0-9a-f-]{36}$/i.test(String(input.requestKey || ''))
  )
    return NextResponse.json(
      { error: 'Enter a US phone number and a message or picture.' },
      { status: 400 },
    );
  let pictureBytes: Uint8Array | null = null;
  if (file) {
    if (file.size > 3 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/gif'].includes(file.type))
      return NextResponse.json({ error: 'Use a JPG, PNG, or GIF picture smaller than 3 MB.' }, { status: 400 });
    pictureBytes = new Uint8Array(await file.arrayBuffer());
    const head = Buffer.from(pictureBytes.subarray(0, 12));
    const valid = file.type === 'image/jpeg' ? head.subarray(0, 3).equals(Buffer.from([255,216,255]))
      : file.type === 'image/png' ? head.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
      : /^GIF8[79]a/.test(head.toString('ascii'));
    if (!valid) return NextResponse.json({ error: 'The uploaded file is not a supported picture.' }, { status: 400 });
  }
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
    .select('e164,provider,capabilities')
    .eq('phone_system_id', ctx.system.id)
    .eq('status', 'active')
    .eq('is_primary', true)
    .maybeSingle();
  if (!number || number.provider !== 'twilio')
    return NextResponse.json({ error: 'An active Twilio messaging number must be configured.' }, { status: 503 });
  if (number.capabilities?.sms !== true || (file && number.capabilities?.mms !== true))
    return NextResponse.json({ error: 'Outbound messaging is awaiting carrier registration and activation.' }, { status: 503 });
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
    const mediaUrls: string[] = [];
    if (file && pictureBytes) {
      const path = `${ctx.system.id}/${ctx.user.id}/${record.id}/picture`;
      const bucket = ctx.db.storage.from(SMS_MEDIA_BUCKET);
      const upload = await bucket.upload(path, pictureBytes, { contentType: file.type, upsert: false });
      if (upload.error) throw Error('Picture upload failed');
      const media: SmsMedia[] = [{ kind: 'storage', path, contentType: file.type }];
      const savedMedia = await ctx.db.from('communication_sms_messages').update({ media }).eq('id', record.id);
      if (savedMedia.error) throw Error('Picture metadata could not be saved');
      const signed = await bucket.createSignedUrl(path, 3600);
      if (signed.error || !signed.data?.signedUrl) throw Error('Picture delivery URL unavailable');
      mediaUrls.push(signed.data.signedUrl);
    }
    const result = await sendTwilioMessage({ from: number.e164, to, body: text, mediaUrls });
    const { error: saved } = await ctx.db
      .from('communication_sms_messages')
      .update({ status: 'accepted', provider_message_id: result.messageId })
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
