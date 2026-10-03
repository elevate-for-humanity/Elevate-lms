import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { logger } from '@/lib/logger';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Status reads use the same Admin origin as input. A visible image alone does
// not prove that a cross-origin authenticated fetch can reach the worker.
export async function GET(req: NextRequest) {
  return proxySession(req, 'GET');
}

export async function DELETE(req: NextRequest) {
  return proxySession(req, 'DELETE');
}

async function proxySession(req: NextRequest, method: 'GET' | 'DELETE') {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  const sessionId = req.nextUrl.searchParams.get('sessionId') || '';
  const resource = req.nextUrl.searchParams.get('resource');
  const token = req.headers.get('x-studio-session-token') || '';
  if (
    !/^[A-Za-z0-9_-]{1,128}$/.test(sessionId) ||
    !token ||
    token.length > 1024 ||
    (method === 'GET' && resource !== 'events' && resource !== 'downloads')
  ) {
    return NextResponse.json(
      { error: 'A valid browser session and status resource are required' },
      { status: 400 },
    );
  }
  await hydrateProcessEnv().catch(() => undefined);
  const workerUrl = (process.env.STUDIO_BROWSER_URL || '').replace(/\/$/, '');
  if (!workerUrl)
    return NextResponse.json(
      { error: 'Studio browser runtime is not configured' },
      { status: 503 },
    );
  try {
    const suffix = method === 'GET' ? `/${resource}` : '';
    const response = await fetch(`${workerUrl}/sessions/${sessionId}${suffix}`, {
      method,
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(6000),
    });
    const payload = await response.json();
    return NextResponse.json(payload, {
      status: response.status,
      headers: { 'cache-control': 'no-store' },
    });
  } catch {
    return NextResponse.json({ error: 'Studio browser status could not be read' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;
  const body = await req.json().catch(() => ({}));
  const sessionId = String(body.sessionId || '');
  const sessionToken = String(body.sessionToken || '');
  const action = body.action;
  if (
    !/^[A-Za-z0-9_-]{1,128}$/.test(sessionId) ||
    !sessionToken ||
    sessionToken.length > 1024 ||
    !action ||
    typeof action !== 'object' ||
    Array.isArray(action)
  ) {
    return NextResponse.json(
      { error: 'A valid browser session and action are required' },
      { status: 400 },
    );
  }

  await hydrateProcessEnv().catch(() => undefined);
  const workerUrl = (process.env.STUDIO_BROWSER_URL || '').replace(/\/$/, '');
  if (!workerUrl) {
    return NextResponse.json(
      { error: 'Studio browser runtime is not configured' },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${workerUrl}/sessions/${sessionId}/actions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sessionToken}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(action),
      cache: 'no-store',
      signal: AbortSignal.timeout(35_000),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      logger.warn('[studio-browser] Action rejected', {
        status: response.status,
        upstreamError: typeof payload?.error === 'string' ? payload.error : undefined,
      });
    }
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    logger.warn('[studio-browser] Action proxy failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: 'Studio browser action could not be completed' },
      { status: 502 },
    );
  }
}
