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
export async function loadPhoneRecording(location: string): Promise<Response> {
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
