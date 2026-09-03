import { NextResponse } from 'next/server';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Compatibility boundary only.
 *
 * Marketing owns the canonical public application writer at /api/applications.
 * The LMS route must never write application, funding, enrollment, document, or
 * account state independently. Keeping this proxy preserves older LMS callers
 * while enforcing one admissions authority and one lifecycle.
 * Production acceptance trigger: 2026-08-22 closeout verification.
 */
function canonicalApplicationUrl(): URL {
  const base =
    process.env.NEXT_PUBLIC_MARKETING_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    PLATFORM_DEFAULTS.siteUrl;
  return new URL('/api/applications', base);
}

function responseHeaders(request: Request): Record<string, string> {
  const requestOrigin = request.headers.get('origin');
  const fallback = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  return {
    'Access-Control-Allow-Origin': requestOrigin || fallback,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Idempotency-Key',
    'Cache-Control': 'no-store',
    Vary: 'Origin',
  };
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, {
    status: 204,
    headers: responseHeaders(request),
  });
}

export async function POST(request: Request) {
  const target = canonicalApplicationUrl();
  const body = await request.text();
  const headers = new Headers({
    Accept: 'application/json',
    'Content-Type': request.headers.get('content-type') || 'application/json',
    // The call is server-to-server from an Elevate compatibility route. Setting
    // the canonical origin lets Marketing apply its same-origin intake controls
    // without weakening its public Turnstile policy.
    Origin: target.origin,
  });

  const idempotencyKey = request.headers.get('x-idempotency-key');
  if (idempotencyKey) headers.set('X-Idempotency-Key', idempotencyKey);

  try {
    const upstream = await fetch(target, {
      method: 'POST',
      headers,
      body,
      cache: 'no-store',
    });
    const payload = await upstream.text();
    return new NextResponse(payload, {
      status: upstream.status,
      headers: {
        ...responseHeaders(request),
        'Content-Type': upstream.headers.get('content-type') || 'application/json',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Application service temporarily unavailable.' },
      { status: 503, headers: responseHeaders(request) },
    );
  }
}
