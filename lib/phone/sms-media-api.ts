import { phoneActorResponse } from './actor-response';
import { hydrateProcessEnv } from '@/lib/secrets';
import { SMS_MEDIA_BUCKET, twilioAccountSid, type SmsMedia } from './twilio';

export async function smsMediaGet(id: string, index: string) {
  const { actor: ctx, response } = await phoneActorResponse();
  if (response) return response;
  if (!ctx.system || !/^[a-f0-9-]{36}$/i.test(id) || !/^[0-9]$/.test(index))
    return new Response(null, { status: 404 });
  let query = ctx.db.from('communication_sms_messages').select('id,owner_profile_id,provider_message_id,media')
    .eq('id', id).eq('phone_system_id', ctx.system.id);
  if (!ctx.roles.some((r) => ['admin','super_admin','org_admin'].includes(r)))
    query = query.eq('owner_profile_id', ctx.user.id);
  const { data: message, error } = await query.maybeSingle();
  if (error) return new Response(null, { status: 503 });
  const media: SmsMedia | undefined = Array.isArray(message?.media) ? message.media[Number(index)] : undefined;
  if (!message || !media) return new Response(null, { status: 404 });
  try {
    let bytes: ArrayBuffer;
    if (media.kind === 'storage') {
      if (media.path !== `${ctx.system.id}/${message.owner_profile_id}/${message.id}/picture`)
        return new Response(null, { status: 404 });
      const { data, error: storageError } = await ctx.db.storage.from(SMS_MEDIA_BUCKET).download(media.path);
      if (storageError || !data) throw Error('Media unavailable');
      bytes = await data.arrayBuffer();
    } else if (media.kind === 'twilio' && /^ME[a-f0-9]{32}$/i.test(media.sid) && /^(SM|MM)[a-f0-9]{32}$/i.test(message.provider_message_id || '')) {
      await hydrateProcessEnv();
      const account = twilioAccountSid(), token = process.env.TWILIO_AUTH_TOKEN?.trim();
      if (!token) throw Error('Media authorization unavailable');
      const remote = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${account}/Messages/${message.provider_message_id}/Media/${media.sid}`, {
        headers: { Authorization: 'Basic ' + Buffer.from(`${account}:${token}`).toString('base64') },
        signal: AbortSignal.timeout(15000), cache: 'no-store',
      });
      if (!remote.ok || !remote.body) throw Error('Media unavailable');
      const reader = remote.body.getReader(), chunks: Uint8Array[] = [];
      let size = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 6 * 1024 * 1024) { await reader.cancel(); return new Response(null, { status: 413 }); }
        chunks.push(value);
      }
      const output = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { output.set(chunk, offset); offset += chunk.length; }
      bytes = output.buffer;
    } else return new Response(null, { status: 404 });
    const type = ['image/jpeg','image/png','image/gif','image/webp'].includes(media.contentType)
      ? media.contentType : 'application/octet-stream';
    return new Response(bytes, { headers: {
      'Content-Type': type, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': type.startsWith('image/') ? 'inline' : 'attachment; filename="message-attachment"',
    } });
  } catch {
    return new Response('Picture temporarily unavailable.', { status: 502 });
  }
}
