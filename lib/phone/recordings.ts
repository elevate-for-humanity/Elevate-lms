import 'server-only';

// Existing signed Telnyx recordings use this exact provider bucket. Never fetch
// an arbitrary DB URL: assignees can update their own inbox rows under RLS.
const CARRIER_HOST = 's3.amazonaws.com';
const CARRIER_PREFIX = '/telephony-recorder-prod/';
const MAX_AUDIO_BYTES = 32 * 1024 * 1024;
const AUDIO_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/webm',
]);

export function carrierRecordingUrl(value: string): URL {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    url.hostname !== CARRIER_HOST ||
    url.port ||
    url.username ||
    url.password ||
    url.hash ||
    !url.pathname.startsWith(CARRIER_PREFIX) ||
    url.pathname.length === CARRIER_PREFIX.length
  ) {
    throw new Error('Untrusted recording location');
  }
  return url;
}

/**
 * Parse a single HTTP byte range. Returns null when the header is absent or
 * not a single byte range (serve the full body), 'unsatisfiable' when the
 * range cannot overlap the audio at all.
 */
export function parseByteRange(
  range: string | null | undefined,
  length: number,
): { start: number; end: number } | 'unsatisfiable' | null {
  if (!range) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match || (match[1] === '' && match[2] === '')) return null;
  if (length === 0) return 'unsatisfiable';
  if (match[1] === '') {
    const suffix = Number(match[2]);
    if (!Number.isFinite(suffix) || suffix <= 0) return 'unsatisfiable';
    return { start: Math.max(0, length - suffix), end: length - 1 };
  }
  const start = Number(match[1]);
  const end = match[2] === '' ? length - 1 : Math.min(Number(match[2]), length - 1);
  if (!Number.isFinite(start) || start >= length || start > end) return 'unsatisfiable';
  return { start, end };
}

/**
 * Build the audio response. Media elements (Safari/WebKit in particular)
 * require Accept-Ranges and 206 responses to load duration metadata and to
 * play at all; without them the player sits at 0:00 on a real recording.
 */
function audioResponse(
  audio: Uint8Array<ArrayBuffer>,
  contentType: string,
  range?: string | null,
): Response {
  const headers: Record<string, string> = {
    'Content-Type': contentType,
    'Cache-Control': 'private, no-store, max-age=0',
    'Content-Disposition': 'inline',
    'X-Content-Type-Options': 'nosniff',
    'Accept-Ranges': 'bytes',
  };
  const parsed = parseByteRange(range, audio.length);
  if (parsed === 'unsatisfiable') {
    return new Response(null, {
      status: 416,
      headers: {
        ...headers,
        'Content-Range': `bytes */${audio.length}`,
        'Content-Length': '0',
      },
    });
  }
  if (parsed) {
    const body = audio.slice(parsed.start, parsed.end + 1);
    return new Response(body, {
      status: 206,
      headers: {
        ...headers,
        'Content-Range': `bytes ${parsed.start}-${parsed.end}/${audio.length}`,
        'Content-Length': String(body.length),
      },
    });
  }
  return new Response(audio, {
    headers: { ...headers, 'Content-Length': String(audio.length) },
  });
}

/** Call only after verifying the requesting user owns the associated inbox row. */
async function loadCarrierRecording(
  location: string,
  range?: string | null,
): Promise<Response> {
  const url = carrierRecordingUrl(location);
  const source = await fetch(url, {
    cache: 'no-store',
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
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
  } finally {
    await reader.cancel().catch(() => {});
  }
  if (!bytes || (declaredSize > 0 && declaredSize !== bytes))
    throw new Error('Incomplete recording');
  const audio = new Uint8Array(bytes);
  let offset = 0;
  for (const chunk of chunks) {
    audio.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const contentType =
    mime === 'application/octet-stream'
      ? Buffer.from(audio).toString('ascii', 0, 4) === 'RIFF'
        ? 'audio/wav'
        : Buffer.from(audio).toString('ascii', 0, 4) === 'OggS'
          ? 'audio/ogg'
          : 'audio/mpeg'
      : mime;
  return audioResponse(audio, contentType, range);
}

/** The caller must first authorize the recording row and its associated call. */
export async function loadPhoneRecording(
  location: string,
  context?: { db?: any; callId?: string; range?: string | null },
): Promise<Response> {
  if (location.startsWith('supabase://')) {
    if (
      !context ||
      !context.db ||
      typeof context.callId !== 'string' ||
      !/^[0-9a-f-]{36}$/i.test(context.callId) ||
      location !== 'supabase://phone-voicemails/' + context.callId + '.wav'
    )
      throw Error('Untrusted private recording location');
    const { data: blob, error } = await context.db.storage
      .from('phone-voicemails')
      .download(context.callId + '.wav');
    if (error || !blob || blob.size < 44 || blob.size > MAX_AUDIO_BYTES)
      throw Error('Private voicemail recording unavailable');
    const audio = new Uint8Array(await blob.arrayBuffer());
    if (
      Buffer.from(audio).toString('ascii', 0, 4) !== 'RIFF' ||
      Buffer.from(audio).toString('ascii', 8, 12) !== 'WAVE'
    )
      throw Error('Private recording is not WAV audio');
    return audioResponse(audio, 'audio/wav', context.range);
  }
  return loadCarrierRecording(location, context?.range);
}
