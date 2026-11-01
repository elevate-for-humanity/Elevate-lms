import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { hydrateProcessEnv } from '@/lib/secrets';
import { logger } from '@/lib/logger';
import { browserConfiguration } from '@/lib/devstudio/browser-configuration';
import { retryableBrowserSessionRejection } from '@/lib/devstudio/studio-browser-session-start';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function configuration() {
  return browserConfiguration(process.env);
}

export async function GET(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  await hydrateProcessEnv();
  const config = configuration();
  if (!config.configured) return NextResponse.json({ configured: false, ready: false });
  try {
    const response = await fetch(`${config.internalUrl}/health`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(20000),
    });
    const health = await response.json();
    return NextResponse.json({ configured: true, ready: response.ok && health?.ready === true, health });
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
  await hydrateProcessEnv();
  const config = configuration();
  if (!config.configured) {
    return NextResponse.json(
      { error: 'Studio browser runtime is not configured' },
      { status: 503 },
    );
  }
  const body = await req.json().catch(() => ({}));
  if (body.action === 'verify') {
    try {
      const response = await fetch(`${config.internalUrl}/foundation-test`, {
        method: 'POST',
        headers: { 'x-studio-browser-secret': config.secret },
        cache: 'no-store',
        signal: AbortSignal.timeout(120000),
      });
      const evidence = await response.json();
      return NextResponse.json(evidence, { status: response.status });
    } catch {
      return NextResponse.json(
        { error: 'Live browser acceptance could not finish' },
        { status: 503 },
      );
    }
  }
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
        // Identity comes from verified Admin auth, never from the request body.
        ownerId: auth.user?.id,
        // Only server-controlled Auth app metadata may shorten fixture lifetime.
        // Neither request JSON nor user-editable user_metadata is trusted.
        disposableQa: auth.user?.app_metadata?.qa_e2e === true,
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
        {
          error: 'Studio browser session could not be created',
          retryable: retryableBrowserSessionRejection(response.status, payload),
        },
        { status: response.status >= 400 && response.status < 600 ? response.status : 502 },
      );
    }
    return NextResponse.json({
      ...payload,
      publicUrl: config.publicUrl,
      // The browser service remains provider-neutral. Canonical Studio context
      // is returned by Admin so the mounted panel can prove it did not detach
      // from the conversation that created the session.
      conversationId:
        typeof body.conversationId === 'string' && body.conversationId.trim()
          ? body.conversationId.trim()
          : null,
      taskId: typeof body.taskId === 'string' && body.taskId.trim() ? body.taskId.trim() : null,
    });
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

