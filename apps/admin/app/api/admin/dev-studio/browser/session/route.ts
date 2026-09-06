import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function configuration() {
  const internalUrl = (process.env.STUDIO_BROWSER_URL || '').replace(/\/$/, '');
  const publicUrl = (
    process.env.NEXT_PUBLIC_STUDIO_BROWSER_URL ||
    process.env.STUDIO_BROWSER_PUBLIC_URL ||
    ''
  ).replace(/\/$/, '');
  const secret = process.env.STUDIO_BROWSER_SECRET || '';
  return { internalUrl, publicUrl, secret, configured: !!(internalUrl && publicUrl && secret) };
}

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  const config = configuration();
  if (!config.configured) return NextResponse.json({ configured: false, ready: false });
  try {
    const response = await fetch(`${config.internalUrl}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    const health = await response.json();
    return NextResponse.json({ configured: true, ready: response.ok, health });
  } catch (error) {
    logger.warn('[studio-browser] Health check failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({
      configured: true,
      ready: false,
      error: 'Studio browser health check failed',
    });
  }
}

export async function POST(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  const config = configuration();
  if (!config.configured) {
    return NextResponse.json(
      { error: 'Studio browser runtime is not configured' },
      { status: 503 },
    );
  }
  const body = await req.json().catch(() => ({}));
  // The browser worker is an isolated Chromium process, so it does not inherit
  // the Admin request's cookie jar. Forward only Supabase auth-cookie chunks
  // over the authenticated internal channel. The worker installs them before
  // the first navigation and never returns or persists them.
  const authCookies = req.cookies
    .getAll()
    .filter(
      ({ name, value }) =>
        name.startsWith('sb-') &&
        (name.endsWith('-auth-token') || /-auth-token\.\d+$/.test(name)) &&
        value.length > 0,
    )
    .slice(0, 12)
    .map(({ name, value }) => ({ name, value }));
  try {
    const response = await fetch(`${config.internalUrl}/sessions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-studio-browser-secret': config.secret },
      body: JSON.stringify({
        url: body.url,
        width: body.width,
        height: body.height,
        authCookies,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(35_000),
    });
    const payload = (await response.json().catch(() => null)) as Record<string, unknown> | null;
    if (!response.ok || !payload) {
      logger.warn('[studio-browser] Session creation rejected', {
        status: response.status,
        upstreamError: typeof payload?.error === 'string' ? payload.error : undefined,
      });
      return NextResponse.json(
        { error: 'Studio browser session could not be created' },
        { status: response.status >= 400 && response.status < 600 ? response.status : 502 },
      );
    }
    return NextResponse.json({ ...payload, publicUrl: config.publicUrl });
  } catch (error) {
    logger.warn('[studio-browser] Session creation failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Studio browser session could not be created' },
      { status: 502 },
    );
  }
}
