import 'server-only';

const privateHeaders = {
  'Cache-Control': 'private, no-store',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

/** Admin preview diagnostics expose transport facts only, never bearer URLs. */
export async function inspectLessonMedia(
  request: Request,
  signedUrl: string,
  asset: 'video' | 'captions' | 'transcript' = 'video',
) {
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 8000);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const probe = new Request(request.url, {
      headers: { Range: 'bytes=0-1023' },
      signal: AbortSignal.any([request.signal, abort.signal]),
    });
    const response = await streamLessonMedia(probe, signedUrl, asset);
    reader = response.body?.getReader();
    const first = await reader?.read();
    const bytes = first?.value?.slice(0, 16) || new Uint8Array();
    return {
      status: response.status,
      contentType: response.headers.get('content-type'),
      contentRange: response.headers.get('content-range'),
      contentLength: response.headers.get('content-length'),
      firstChunkBytes: first?.value?.byteLength || 0,
      fileSignature: Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(''),
    };
  } finally {
    clearTimeout(timeout);
    abort.abort();
    await reader?.cancel().catch(() => {});
  }
}

/** Keep bearer URLs server-side; every media/range request rechecks lesson access. */
export async function streamLessonMedia(
  request: Request,
  signedUrl: string,
  asset: 'video' | 'captions' | 'transcript' = 'video',
) {
  let range = request.headers.get('range');
  if (range && (range.length > 80 || !/^bytes=(?:\d+-\d*|-\d+)$/.test(range))) {
    return Response.json(
      { error: 'Invalid media range' },
      { status: 416, headers: privateHeaders },
    );
  }
  // Browsers commonly ask for bytes=0- (the whole movie). Keep each partial
  // response below the hosting response ceiling; the player requests the next
  // range as playback or seeking advances. No MP4 bytes are rewritten.
  if (range && asset === 'video' && request.method !== 'HEAD') {
    const [startText, endText] = range.slice(6).split('-');
    const start = startText ? Number(startText) : null;
    const end = endText ? Number(endText) : null;
    if (
      (start !== null && !Number.isSafeInteger(start)) ||
      (end !== null && !Number.isSafeInteger(end)) ||
      (start === null && !end) ||
      (start !== null && end !== null && end < start)
    ) {
      return Response.json(
        { error: 'Invalid media range' },
        { status: 416, headers: privateHeaders },
      );
    }
    const chunk = 8 * 1024 * 1024;
    range =
      start === null
        ? `bytes=-${Math.min(end!, chunk)}`
        : `bytes=${start}-${Math.min(end ?? Number.MAX_SAFE_INTEGER, start + chunk - 1)}`;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  let upstream: Response;
  try {
    upstream = await fetch(signedUrl, {
      method: request.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: { 'Accept-Encoding': 'identity', ...(range ? { Range: range } : {}) },
      cache: 'no-store',
      redirect: 'error',
      signal: AbortSignal.any([request.signal, controller.signal]),
    });
  } finally {
    clearTimeout(timer);
  }
  const headers = new Headers(privateHeaders);
  for (const name of ['content-length', 'content-range', 'accept-ranges']) {
    const value = upstream.headers.get(name);
    // A full movie can exceed Cloud Run's 32 MiB non-streamed response limit.
    // Let the HTTP adapter stream/chunk GET bodies instead of advertising a
    // fixed full-object length. HEAD metadata and partial range lengths remain.
    if (
      value &&
      (name !== 'content-length' || request.method === 'HEAD' || upstream.status === 206)
    )
      headers.set(name, value);
  }
  if (upstream.status === 416) {
    await upstream.body?.cancel();
    return new Response(null, { status: 416, headers });
  }
  if (![200, 206].includes(upstream.status)) {
    await upstream.body?.cancel();
    if (upstream.status === 404)
      return Response.json(
        { error: 'Lesson media not found' },
        { status: 404, headers: privateHeaders },
      );
    throw new Error('LESSON_MEDIA_UPSTREAM_UNAVAILABLE');
  }
  const type = upstream.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (asset === 'transcript') {
    if (!type || !['text/plain', 'application/octet-stream'].includes(type)) {
      await upstream.body?.cancel();
      throw new Error('LESSON_MEDIA_TYPE_INVALID');
    }
    headers.set('Content-Type', 'text/plain; charset=utf-8');
  } else if (asset === 'captions') {
    if (type && !['text/vtt', 'text/plain', 'application/octet-stream'].includes(type)) {
      await upstream.body?.cancel();
      throw new Error('LESSON_MEDIA_TYPE_INVALID');
    }
    headers.set('Content-Type', 'text/vtt; charset=utf-8');
  } else {
    if (!type || !/^(video\/|audio\/|application\/octet-stream$)/.test(type)) {
      await upstream.body?.cancel();
      throw new Error('LESSON_MEDIA_TYPE_INVALID');
    }
    headers.set('Content-Type', type);
  }
  headers.set('Content-Disposition', 'inline');
  return new Response(request.method === 'HEAD' ? null : upstream.body, {
    status: upstream.status,
    headers,
  });
}
