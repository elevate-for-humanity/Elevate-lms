import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function configuration() {
  const internalUrl = (process.env.STUDIO_BROWSER_URL || '').replace(/\/$/, '');
  const publicUrl = (process.env.NEXT_PUBLIC_STUDIO_BROWSER_URL || process.env.STUDIO_BROWSER_PUBLIC_URL || '').replace(/\/$/, '');
  const secret = process.env.STUDIO_BROWSER_SECRET || '';
  return { internalUrl, publicUrl, secret, configured: !!(internalUrl && publicUrl && secret) };
}

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  const config = configuration();
  if (!config.configured) return NextResponse.json({ configured: false, ready: false });
  try {
    const response = await fetch(`${config.internalUrl}/health`, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
    const health = await response.json();
    return NextResponse.json({ configured: true, ready: response.ok, health });
  } catch {
    return NextResponse.json({ configured: true, ready: false });
  }
}

export async function POST(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  const config = configuration();
  if (!config.configured) {
    return NextResponse.json({ error: 'Studio browser runtime is not configured' }, { status: 503 });
  }
  const body = await req.json().catch(() => ({}));
  const response = await fetch(`${config.internalUrl}/sessions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-studio-browser-secret': config.secret },
    body: JSON.stringify({ url: body.url, width: body.width, height: body.height }),
    cache: 'no-store',
    signal: AbortSignal.timeout(35_000),
  });
  const payload = await response.json().catch(() => ({ error: 'Studio browser returned an invalid response' }));
  if (!response.ok) return NextResponse.json(payload, { status: response.status });
  return NextResponse.json({ ...payload, publicUrl: config.publicUrl });
}
