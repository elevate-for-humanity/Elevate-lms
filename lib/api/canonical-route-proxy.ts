import { NextResponse } from 'next/server';

type CanonicalService = 'marketing' | 'admin';

const DEFAULT_ORIGINS: Record<CanonicalService, string> = {
  marketing: 'https://www.elevateforhumanity.org',
  admin: 'https://admin.elevateforhumanity.org',
};

function canonicalOrigin(service: CanonicalService): string {
  const configured =
    service === 'marketing'
      ? process.env.NEXT_PUBLIC_MARKETING_URL || process.env.NEXT_PUBLIC_SITE_URL
      : process.env.NEXT_PUBLIC_ADMIN_URL;
  return (configured || DEFAULT_ORIGINS[service]).replace(/\/$/, '');
}

/**
 * Preserve an existing same-path endpoint while giving its mutations to one
 * canonical service. Raw request bytes and security headers are forwarded so
 * signed webhooks, multipart uploads, cookies and bearer authentication retain
 * their original contracts.
 */
export async function proxyCanonicalRoute(
  request: Request,
  service: CanonicalService,
  pathname: string,
): Promise<Response> {
  const target = new URL(pathname, canonicalOrigin(service));
  const incomingUrl = new URL(request.url);
  target.search = incomingUrl.search;

  if (target.origin === incomingUrl.origin) {
    return NextResponse.json(
      { error: 'Canonical route adapter is configured to call itself.' },
      { status: 500, headers: { 'cache-control': 'no-store' } },
    );
  }

  const headers = new Headers();
  for (const name of [
    'accept',
    'authorization',
    'content-type',
    'cookie',
    'idempotency-key',
    'stripe-signature',
    'x-api-key',
    'x-hub-signature',
    'x-hub-signature-256',
    'x-jotform-secret',
    'x-partner-signature',
    'x-request-id',
    'x-webhook-secret',
  ]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set('x-elevate-adapter-origin', incomingUrl.origin);
  headers.set('x-forwarded-host', incomingUrl.host);
  headers.set('x-forwarded-proto', incomingUrl.protocol.replace(':', ''));

  const method = request.method.toUpperCase();
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();

  try {
    const upstream = await fetch(target, {
      method,
      headers,
      body,
      cache: 'no-store',
      redirect: 'manual',
    });
    const responseHeaders = new Headers();
    for (const name of ['content-type', 'location', 'retry-after', 'set-cookie']) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    responseHeaders.set('cache-control', 'no-store');
    responseHeaders.set('x-elevate-canonical-service', service);
    return new Response(await upstream.arrayBuffer(), {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      { error: 'Canonical service temporarily unavailable.' },
      { status: 503, headers: { 'cache-control': 'no-store', 'retry-after': '5' } },
    );
  }
}
