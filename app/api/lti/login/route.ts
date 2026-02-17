export const runtime = 'edge';
export const maxDuration = 60;
// AUTH: Intentionally public — no authentication required

// app/api/lti/login/route.ts
import { NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export async function GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const url = new URL(request.url);
  const iss = url.searchParams.get('iss');
  const loginHint = url.searchParams.get('login_hint');
  const clientId = url.searchParams.get('client_id');
  const targetLinkUri = url.searchParams.get('target_link_uri');

  if (!iss || !loginHint || !clientId || !targetLinkUri) {
    return NextResponse.json({ error: 'Missing LTI parameters' }, { status: 400 });
  }

  const state = crypto.randomUUID();
  const nonce = crypto.randomUUID();

  // You should store state + nonce in a secure cookie/session; this is a skeleton.
  const redirect = new URL(targetLinkUri);

  redirect.searchParams.set('iss', iss);
  redirect.searchParams.set('login_hint', loginHint);
  redirect.searchParams.set('client_id', clientId);
  redirect.searchParams.set('state', state);
  redirect.searchParams.set('nonce', nonce);

  return NextResponse.redirect(redirect.toString());
}
