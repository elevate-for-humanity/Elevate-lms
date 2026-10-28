import 'server-only';

const privateHeaders = { 'Cache-Control': 'private, no-store', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' };

/** Keep bearer URLs server-side; every media/range request rechecks lesson access. */
export async function streamLessonMedia(request: Request, signedUrl: string, asset: 'video' | 'captions' = 'video') {
  const range = request.headers.get('range');
  if (range && (range.length > 80 || !/^bytes=(?:\d+-\d*|-\d+)$/.test(range))) {
    return Response.json({ error: 'Invalid media range' }, { status: 416, headers: privateHeaders });
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  let upstream: Response;
  try {
    upstream = await fetch(signedUrl, {
      method: request.method === 'HEAD' ? 'HEAD' : 'GET',
      headers: { 'Accept-Encoding': 'identity', ...(range ? { Range: range } : {}) },
      cache: 'no-store', redirect: 'error',
      signal: AbortSignal.any([request.signal, controller.signal]),
    });
  } finally { clearTimeout(timer); }
  const headers = new Headers(privateHeaders);
  for (const name of ['content-length', 'content-range', 'accept-ranges']) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  if (upstream.status === 416) {
    await upstream.body?.cancel();
    return new Response(null, { status: 416, headers });
  }
  if (![200, 206].includes(upstream.status)) {
    await upstream.body?.cancel();
    if (upstream.status === 404) return Response.json({ error: 'Lesson media not found' }, { status: 404, headers: privateHeaders });
    throw new Error('LESSON_MEDIA_UPSTREAM_UNAVAILABLE');
  }
  const type = upstream.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (asset === 'captions') {
    if (type && !['text/vtt', 'text/plain', 'application/octet-stream'].includes(type)) {
      await upstream.body?.cancel(); throw new Error('LESSON_MEDIA_TYPE_INVALID');
    }
    headers.set('Content-Type', 'text/vtt; charset=utf-8');
  } else {
    if (!type || !/^(video\/|audio\/|application\/octet-stream$)/.test(type)) {
      await upstream.body?.cancel(); throw new Error('LESSON_MEDIA_TYPE_INVALID');
    }
    headers.set('Content-Type', type);
  }
  headers.set('Content-Disposition', 'inline');
  return new Response(request.method === 'HEAD' ? null : upstream.body, { status: upstream.status, headers });
}
