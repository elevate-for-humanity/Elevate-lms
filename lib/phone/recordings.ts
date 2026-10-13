import 'server-only';

// Existing signed Telnyx recordings use this exact provider bucket. Never fetch
// an arbitrary DB URL: assignees can update their own inbox rows under RLS.
const CARRIER_HOST = 's3.amazonaws.com';
const CARRIER_PREFIX = '/telephony-recorder-prod/';
const MAX_AUDIO_BYTES = 32 * 1024 * 1024;
const AUDIO_TYPES = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/webm']);

export function carrierRecordingUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== CARRIER_HOST || url.port ||
      url.username || url.password || url.hash || !url.pathname.startsWith(CARRIER_PREFIX) ||
      url.pathname.length === CARRIER_PREFIX.length) {
    throw new Error('Untrusted recording location');
  }
  return url;
}

/** Call only after verifying the requesting user owns the associated inbox row. */
async function loadCarrierRecording(location: string): Promise<Response> {
  const url = carrierRecordingUrl(location);
  const source = await fetch(url, {
    cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000),
    headers: { Accept: 'audio/*, application/octet-stream' },
  });
  if (!source.ok || !source.body) throw new Error('Recording unavailable');
  const mime = source.headers.get('content-type')?.split(';')[0].trim().toLowerCase() || '';
  if (!AUDIO_TYPES.has(mime) && mime !== 'application/octet-stream') {
    await source.body.cancel();
    throw new Error('Recording is not audio');
  }
  const declaredSize = Number(source.headers.get('content-length'));
  if (declaredSize > MAX_AUDIO_BYTES) {
    await source.body.cancel();
    throw new Error('Recording too large');
  }
  // Bound actual bytes as well as Content-Length, and finish the download before
  // reporting success or marking the voicemail read. URLs and errors stay private.
  const reader = source.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      bytes += result.value.byteLength;
      if (bytes > MAX_AUDIO_BYTES) throw new Error('Recording too large');
      chunks.push(result.value);
    }
  } finally { await reader.cancel().catch(() => {}); }
  if (!bytes || (declaredSize > 0 && declaredSize !== bytes)) throw new Error('Incomplete recording');
  const audio = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) { audio.set(chunk, offset); offset += chunk.byteLength; }
  return new Response(audio, { headers: {
    'Content-Type': mime === 'application/octet-stream' ? 'audio/mpeg' : mime,
    'Content-Length': String(bytes), 'Cache-Control': 'private, no-store, max-age=0',
    'Content-Disposition': 'inline', 'X-Content-Type-Options': 'nosniff',
  } });
}

/** The caller must first authorize the recording row and its associated call. */
export async function loadPhoneRecording(location:string,context?:{db:any;callId:string}):Promise<Response>{
 if(location.startsWith('supabase://')){
  if(!context || !/^[0-9a-f-]{36}$/i.test(context.callId) || location!=='supabase://phone-voicemails/'+context.callId+'.wav')throw Error('Untrusted private recording location');
  const {data:blob,error}=await context.db.storage.from('phone-voicemails').download(context.callId+'.wav');
  if(error||!blob||blob.size<44||blob.size>1100000)throw Error('Private voicemail recording unavailable');
  const audio=new Uint8Array(await blob.arrayBuffer());
  if(Buffer.from(audio).toString('ascii',0,4)!=='RIFF'||Buffer.from(audio).toString('ascii',8,12)!=='WAVE')throw Error('Private recording is not WAV audio');
  return new Response(audio,{headers:{'Content-Type':'audio/wav','Content-Length':String(audio.length),'Cache-Control':'private, no-store, max-age=0','Content-Disposition':'inline','X-Content-Type-Options':'nosniff'}});
 }
 try{return await loadCarrierRecording(location);}catch(error){
  if(!context || !/^[0-9a-f-]{36}$/i.test(context.callId))throw error;
  const {data:events,error:lookupError}=await context.db.from('phone_call_events').select('payload').eq('call_id',context.callId).eq('event_type','call.recording.saved').order('created_at',{ascending:false}).limit(10);
  if(lookupError)throw new Error('Recording lookup unavailable',{cause:error});
  const event=(events||[]).map((row:any)=>row.payload).find((payload:any)=>[payload?.recording_urls?.mp3,payload?.recording_urls?.wav,payload?.public_recording_urls?.mp3,payload?.public_recording_urls?.wav].includes(location));
  if(!event || !/^[0-9a-f-]{36}$/i.test(event.recording_id||''))throw new Error('Recording recovery reference unavailable',{cause:error});
  const {telnyxClient}=await import('@/lib/phone/telnyx');
  const result=await (await telnyxClient()).recordings.retrieve(event.recording_id);
  const refreshed=refreshedRecordingUrl(event,result.data);
  return loadCarrierRecording(refreshed);
 }
}
export function refreshedRecordingUrl(event:any,recording:any):string{
 if(recording?.id!==event.recording_id || (event.call_session_id && recording.call_session_id!==event.call_session_id))throw new Error('Recording identity mismatch');
 const location=recording.download_urls?.mp3 || recording.download_urls?.wav;
 if(typeof location!=='string')throw new Error('Recording download unavailable');
 carrierRecordingUrl(location);
 return location;
}
