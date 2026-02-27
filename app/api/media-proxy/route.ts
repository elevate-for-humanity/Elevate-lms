import { NextRequest, NextResponse } from 'next/server';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Proxies Supabase storage media through the same origin.
 * Supports Range requests for video seeking.
 */
async function _GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  // Only allow proxying from our Supabase storage
  const ALLOWED_HOST = 'cuxzzpsyufcewtmicszk.supabase.co';
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== ALLOWED_HOST) {
      return NextResponse.json({ error: 'Forbidden host' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Forward Range header for video seeking
  const reqHeaders: HeadersInit = {};
  const rangeHeader = request.headers.get('Range');
  if (rangeHeader) {
    reqHeaders['Range'] = rangeHeader;
  }

  const upstream = await fetch(url, { headers: reqHeaders });
  if (!upstream.ok && upstream.status !== 206) {
    return new NextResponse('Upstream error', { status: upstream.status });
  }

  const headers = new Headers();
  headers.set('Content-Type', upstream.headers.get('Content-Type') || 'video/mp4');
  if (upstream.headers.get('Content-Length')) {
    headers.set('Content-Length', upstream.headers.get('Content-Length')!);
  }
  if (upstream.headers.get('Content-Range')) {
    headers.set('Content-Range', upstream.headers.get('Content-Range')!);
  }
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=86400');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}
export const GET = withApiAudit('/api/media-proxy', _GET);
