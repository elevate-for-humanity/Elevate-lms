import { NextResponse } from 'next/server';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { storeSmsEvent } from './sms-inbound';
import { inboundTwilioMedia, TWILIO_SMS_WEBHOOK, twilioAccountSid, validTwilioSignature } from './twilio';

export async function twilioSmsWebhook(request: Request, statusCallback = false) {
  await hydrateProcessEnv();
  const token = process.env.TWILIO_AUTH_TOKEN?.trim();
  if (!token) return NextResponse.json({ error: 'Messaging signature configuration unavailable.' }, { status: 503 });
  if (!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded'))
    return new Response(null, { status: 415 });
  const body = await request.text();
  if (body.length > 128000) return new Response(null, { status: 413 });
  const params = new URLSearchParams(body);
  const url = TWILIO_SMS_WEBHOOK + (statusCallback ? '/status' : '');
  if (!validTwilioSignature(token, url, params, request.headers.get('x-twilio-signature') || ''))
    return new Response(null, { status: 403 });
  let account: string;
  try { account = twilioAccountSid(); } catch { return new Response(null, { status: 503 }); }
  const sid = params.get('MessageSid') || '';
  if (params.get('AccountSid') !== account || !/^(?:SM|MM)[a-f0-9]{32}$/i.test(sid))
    return new Response(null, { status: 403 });
  try {
    const db = await requireAdminClient();
    if (statusCallback) {
      const status = params.get('MessageStatus') || '';
      if (!['accepted','queued','sending','sent','delivered','undelivered','failed','canceled'].includes(status))
        return new Response(null, { status: 400 });
      const [{ data: message, error: readError }, { data: logs, error: logsError }] = await Promise.all([
        db.from('communication_sms_messages').select('id').eq('provider_message_id', sid).maybeSingle(),
        db.from('delivery_logs').select('id').eq('provider_message_id', sid).limit(1),
      ]);
      if (readError || logsError || (!message && !logs?.length))
        return new Response(null, { status: 503 }); // Retry a receipt that arrived before its acceptance record.
      const failed = ['undelivered','failed','canceled'].includes(status);
      if (message) {
        const result = await db.from('communication_sms_messages').update({ status,
          error_message: failed ? 'Twilio reported that the message was not delivered.' : null })
          .eq('id', message.id).in('status', ['pending','accepted','queued','sending','sent']);
        if (result.error) throw Error('Message status storage failed');
      }
      if (logs?.length) {
        const result = await db.from('delivery_logs').update({
          status: failed ? 'failed' : status === 'delivered' ? 'delivered' : status === 'sent' ? 'sent' : 'pending',
          ...(['sent','delivered'].includes(status) ? { sent_at: new Date().toISOString() } : {}),
          error_message: failed ? 'Twilio reported a delivery failure.' : null,
        }).eq('provider_message_id', sid).in('status', ['pending','sent']);
        if (result.error) throw Error('Delivery status storage failed');
      }
      return new Response(null, { status: 204 });
    }
    const from = params.get('From') || '', to = params.get('To') || '';
    if (!/^\+[1-9]\d{7,14}$/.test(from) || !/^\+[1-9]\d{7,14}$/.test(to))
      return new Response(null, { status: 400 });
    const { data: number, error } = await db.from('phone_numbers').select('id').eq('e164', to)
      .eq('provider', 'twilio').eq('status', 'active').maybeSingle();
    if (error || !number) return new Response(null, { status: 503 });
    await storeSmsEvent(db, { data: { id: `twilio:${sid}`, event_type: 'message.received', payload: {
      id: sid, from: { phone_number: from }, to: [{ phone_number: to }], text: params.get('Body') || '',
      media: inboundTwilioMedia(params),
    } } });
    return new Response('<?xml version="1.0" encoding="UTF-8"?><Response/>', {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  } catch {
    return NextResponse.json({ error: 'Message storage is temporarily unavailable.' }, { status: 503 });
  }
}
