import { NextResponse } from 'next/server';
import { phoneActorResponse } from './actor-response';
import { phoneSpeechChunks } from './speech-audio';
import { loadPhoneRecording } from './recordings';
import {notifyAssignee} from './message-notifications';
export async function transcribePhoneMessage(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { actor: ctx, response } = await phoneActorResponse();
  if (response) return response;
  if (ctx.previewing || !ctx.system)
    return NextResponse.json({ error: 'A live phone account is required.' }, { status: 403 });
  const { kind, id } = await params;
  if (!['voicemail', 'callback'].includes(kind) || !/^[0-9a-f-]{36}$/i.test(id))
    return NextResponse.json({ error: 'Message not found.' }, { status: 404 });
  const admin = ctx.roles.some((r) => ['admin', 'super_admin', 'org_admin'].includes(r));
  let query =
    kind === 'voicemail'
      ? ctx.db
          .from('voicemails')
          .select('recording_url,call_id,transcription,assigned_profile_id,extension_id,phone_number')
          .eq('phone_system_id', ctx.system.id)
      : ctx.db
          .from('phone_callback_tasks')
          .select('recording_url,call_id,transcript,assigned_profile_id,extension_id,callback_number,source,call:phone_calls!inner(phone_system_id)')
          .eq('call.phone_system_id', ctx.system.id);
  query = query.eq('id', id);
  if (!admin) query = query.eq('assigned_profile_id', ctx.user.id);
  const { data: row, error } = await query.maybeSingle();
  if (error || !row?.recording_url || !row.call_id)
    return NextResponse.json({ error: 'Recording unavailable.' }, { status: 404 });
  const existing = 'transcription' in row ? row.transcription : row.transcript;
  const persistTranscript=async(transcript:string,summary:string)=>{
    const voicemail = await ctx.db
      .from('voicemails')
      .update({ transcription: transcript, summary })
      .eq('call_id', row.call_id);
    const callback = await ctx.db
      .from('phone_callback_tasks')
      .update({
        transcript,
        summary,
        updated_at: new Date().toISOString(),
      })
      .eq('call_id', row.call_id);
    if (voicemail.error || callback.error) throw Error('Transcript storage unavailable');
  };
  const notifyRecovered=async(transcript:string,summary?:string)=>{
    if(kind!=='voicemail'&&row.source!=='voicemail')return;
    // Resolve the canonical paired task: its ID owns delivery claims even
    // when this endpoint was opened through the voicemail inbox.
    const task=await ctx.db.from('phone_callback_tasks')
      .select('id,assigned_profile_id,callback_number,extension_id')
      .eq('call_id',row.call_id).eq('source','voicemail').maybeSingle();
    if(task.error)throw Error('Voicemail notification routing unavailable');
    // Legacy imported recordings may have no callback task. Keep their
    // transcript readable without inventing a new notification identity.
    if(!task.data)return;
    if(task.data.assigned_profile_id!==row.assigned_profile_id)
      throw Error('Voicemail notification routing unavailable');
    const extension=task.data.extension_id?await ctx.db.from('communication_extensions').select('extension')
      .eq('id',task.data.extension_id).maybeSingle():{data:null,error:null};
    if(extension.error)throw Error('Voicemail extension unavailable');
    await notifyAssignee(ctx.db,{profileId:task.data.assigned_profile_id,taskId:task.data.id,
      caller:task.data.callback_number||'unknown',extension:extension.data?.extension,
      urgency:'normal',source:'voicemail',transcript,summary,awaitingTranscript:false,transcriptUpdate:true},ctx.system);
  };
  try {
    // A previous retry may have stored the transcript before notification
    // completed. Durable per-channel claims make this retry safe.
    if(existing){await persistTranscript(existing,existing.slice(0,1000));await notifyRecovered(existing);return NextResponse.json({transcript:existing});}
    const audio = await loadPhoneRecording(row.recording_url, { db: ctx.db, callId: row.call_id });
    const chunks = await phoneSpeechChunks(Buffer.from(await audio.arrayBuffer()));
    const metadata = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      {
        headers: { 'Metadata-Flavor': 'Google' },
        redirect: 'error',
        cache: 'no-store',
        signal: AbortSignal.timeout(3000),
      },
    );
    if (!metadata.ok || metadata.headers.get('Metadata-Flavor') !== 'Google')
      throw Error('Speech authorization unavailable');
    const identity = await metadata.json();
    const token = identity.access_token;
    if (typeof token !== 'string' || !token) throw Error('Speech authorization unavailable');
    const signal = AbortSignal.timeout(40000);
    const parts: string[] = [];
    for (let index = 0; index < chunks.length; index += 2) {
      const batch = await Promise.all(
        chunks.slice(index, index + 2).map(async (content) => {
          const speech = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              config: {
                encoding: 'LINEAR16',
                sampleRateHertz: 16000,
                languageCode: 'en-US',
                model: 'phone_call',
                enableAutomaticPunctuation: true,
              },
              audio: { content: content.toString('base64') },
            }),
            redirect: 'error',
            signal,
          });
          if (!speech.ok) throw Error('Speech service did not accept the recording');
          const result = await speech.json();
          return (result.results || [])
            .map((r: any) => r.alternatives?.[0]?.transcript || '')
            .filter(Boolean)
            .join('\n');
        }),
      );
      parts.push(...batch);
    }
    const transcript = parts.filter(Boolean).join('\n');
    const summary=transcript.slice(0,1000)||'No speech was detected. Open the recording to listen.';
    await persistTranscript(transcript,summary);
    await notifyRecovered(transcript,summary);
    if(!transcript)return NextResponse.json({error:'No speech was detected. Listen to the recording.'},{status:422});
    return NextResponse.json({ transcript });
  } catch {
    return NextResponse.json(
      { error: 'Transcription could not complete. The original recording is retained.' },
      { status: 503 },
    );
  }
}
