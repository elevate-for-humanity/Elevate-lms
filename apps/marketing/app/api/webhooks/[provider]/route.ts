import { NextRequest, NextResponse } from 'next/server';
import { safeError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROVIDER_TARGETS: Record<string, string> = {
  jotform: '/api/webhooks/jotform',
  stripe: '/api/webhooks/stripe',
  marketplace: '/api/webhooks/marketplace',
  store: '/api/webhooks/store',
  sendgrid: '/api/webhooks/sendgrid-inbound',
};

const FORWARDED_HEADER_PREFIXES = ['stripe-', 'x-', 'sendgrid-'];
const FORWARDED_HEADERS = new Set(['authorization', 'content-type', 'user-agent']);

function buildForwardHeaders(request: NextRequest, provider: string): Headers {
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (
      FORWARDED_HEADERS.has(lowerKey) ||
      FORWARDED_HEADER_PREFIXES.some((prefix) => lowerKey.startsWith(prefix))
    ) {
      headers.set(key, value);
    }
  });
  headers.set('x-forwarded-webhook-provider', provider);
  return headers;
}

// PUBLIC ROUTE: third-party webhook providers cannot use app session auth; provider-specific target routes verify signatures/secrets.
export async function POST(request: NextRequest, { params }: { params: { provider: string } }) {
  const provider = params.provider?.toLowerCase();
  const targetPath = PROVIDER_TARGETS[provider];
  if (!targetPath) return safeError('Unsupported webhook provider', 404);

  if (request.nextUrl.pathname === targetPath) {
    return safeError('Webhook forwarding loop detected', 400);
  }

  const target = new URL(targetPath, request.url);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.set(key, value));

  return fetch(target, {
    method: 'POST',
    headers: buildForwardHeaders(request, provider),
    body: await request.text(),
    redirect: 'manual',
  });
}

// PUBLIC ROUTE: operational metadata only; no user/provider payload is returned.
export async function GET(_request: NextRequest, { params }: { params: { provider: string } }) {
  const provider = params.provider?.toLowerCase();
  return NextResponse.json({
    ok: Boolean(PROVIDER_TARGETS[provider]),
    provider,
    supported: Object.keys(PROVIDER_TARGETS),
  });
}
