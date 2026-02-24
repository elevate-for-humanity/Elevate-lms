import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Proxies Supabase storage media through the same origin.
 * Needed because some preview environments (Gitpod) block cross-origin media loads.
 * In production on Netlify, the direct Supabase URLs work fine.
 */
export async function GET(request: NextRequest) {
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

  const upstream = await fetch(url);
  if (!upstream.ok) {
    return new NextResponse('Upstream error', { status: upstream.status });
  }

  const headers = new Headers();
  headers.set('Content-Type', upstream.headers.get('Content-Type') || 'video/mp4');
  headers.set('Content-Length', upstream.headers.get('Content-Length') || '');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('Cache-Control', 'public, max-age=86400');

  return new NextResponse(upstream.body, { status: 200, headers });
}
