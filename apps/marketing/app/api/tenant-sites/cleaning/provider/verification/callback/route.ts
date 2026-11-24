import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  completeProviderEmailVerification, ProviderVerificationFailure, providerVerificationCallbackDatabase,
  providerVerificationCookie, providerVerificationReturn, type ProviderVerificationMarker,
} from '@/lib/cleaning/provider-email-verification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cookie = providerVerificationCookie();
  let marker: ProviderVerificationMarker = 'failed';
  try {
    const db = await providerVerificationCallbackDatabase(request);
    const session = await createClient();
    const params = new URL(request.url).searchParams;
    await completeProviderEmailVerification({
      db, session,
      state: params.getAll('state').length === 1 ? params.get('state') : null,
      code: params.getAll('code').length === 1 ? params.get('code') : null,
      browserNonce: request.cookies.get(cookie.name)?.value,
    });
    marker = 'success';
  } catch (error) {
    if (error instanceof ProviderVerificationFailure) marker = error.marker;
  }
  const response = NextResponse.redirect(providerVerificationReturn(marker), 303);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.cookies.set(cookie.name, '', { ...cookie.options, maxAge: 0 });
  return response;
}
