import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { CleaningError } from '@/lib/cleaning/server';
import {
  completeProviderEmailVerification, ProviderVerificationFailure, providerVerificationCallbackDatabase,
  providerVerificationCookie, providerVerificationReturn, type ProviderVerificationMarker,
} from '@/lib/cleaning/provider-email-verification';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cookie = providerVerificationCookie();
  let marker: ProviderVerificationMarker = 'failed';
  let clearNonce = false;
  let retryAfter: string | null | undefined;
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
    clearNonce = true;
  } catch (error) {
    if (error instanceof ProviderVerificationFailure) {
      marker = error.marker;
      clearNonce = error.challengeConsumed;
    }
    if (error instanceof CleaningError) retryAfter = error.retryAfter;
  }
  const response = NextResponse.redirect(providerVerificationReturn(marker), 303);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  if (retryAfter) response.headers.set('Retry-After', retryAfter);
  if (clearNonce) response.cookies.set(cookie.name, '', { ...cookie.options, maxAge: 0 });
  return response;
}
