import { NextRequest, NextResponse } from 'next/server';
import { createRecoveryClient } from '@/lib/supabase/recovery';
import { getServerPublicSupabaseConfig } from '@/lib/supabase/public-config';
import { sessionCookieOptions } from '@/lib/auth/session-cookie-options';
import { siteUrls } from '@/lib/utils/site-urls';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function resetTarget(value: string | null) {
  const destination = new URL('/reset-password?mode=recovery', siteUrls.app);
  try {
    const candidate = new URL(value || '', siteUrls.app);
    if (candidate.origin === destination.origin && candidate.pathname === '/reset-password') {
      const portal = candidate.searchParams.get('portal');
      if (['program-holder', 'host-shop', 'employer'].includes(portal || '')) destination.searchParams.set('portal', portal!);
    }
  } catch { /* Recovery always stays on the password form. */ }
  return destination;
}
function failed(value: string | null, reason: string) {
  const destination = resetTarget(value);
  destination.searchParams.set('error', reason);
  const response = NextResponse.redirect(destination, 303);
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
function escapeHtml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

/** Do not consume one-time credentials when an email scanner previews a GET. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const token = params.get('token_hash') || '';
  const code = params.get('code') || '';
  if (!token && !code) return failed(params.get('next'), 'missing_recovery_token');
  const next = resetTarget(params.get('next')).pathname + resetTarget(params.get('next')).search;
  const body = '<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Set your password | Elevate</title></head><body style="margin:0;background:#f8fafc;color:#0f172a;font:18px system-ui"><main style="max-width:440px;margin:10vh auto;padding:32px;background:white;border:1px solid #e2e8f0;border-radius:20px"><h1>Set your password</h1><p>Continue to open your secure password setup form.</p><form method="post" action="/api/auth/recovery-callback"><input type="hidden" name="token_hash" value="' + escapeHtml(token) + '"><input type="hidden" name="code" value="' + escapeHtml(code) + '"><input type="hidden" name="next" value="' + escapeHtml(next) + '"><button type="submit" style="font:inherit;background:#1e3a8a;color:white;border:0;border-radius:8px;padding:16px;width:100%">Continue to Password Setup</button></form><p style="font-size:14px">If this link has expired, you can request a fresh one on the next screen.</p></main></body></html>';
  return new NextResponse(body, { headers: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'private, no-store',
    // Preserve Origin on the same-origin form POST; suppress referrers elsewhere.
    'Referrer-Policy': 'same-origin',
    'X-Robots-Tag': 'noindex, nofollow',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
  } });
}

/** Persist recovery cookies on the actual redirect response, never a discarded response. */
export async function POST(request: NextRequest) {
  if (request.headers.get('origin') !== new URL(siteUrls.app).origin) return new NextResponse('Invalid origin', { status: 403 });
  const form = await request.formData().catch(() => null);
  const token = String(form?.get('token_hash') || '');
  const code = String(form?.get('code') || '');
  const next = String(form?.get('next') || '');
  if (!token && !code) return failed(next, 'missing_recovery_token');
  const config = getServerPublicSupabaseConfig();
  if (!config) return failed(next, 'recovery_unavailable');
  const cookies: Array<{ name: string; value: string; options: any }> = [];
  const supabase = createRecoveryClient(config, {
    getAll: () => request.cookies.getAll(),
    setAll: (values) => { cookies.push(...values); },
  });
  const result = token
    ? await supabase.auth.verifyOtp({ type: 'recovery', token_hash: token })
    : await supabase.auth.exchangeCodeForSession(code);
  if (result.error || !result.data?.session) return failed(next, 'recovery_failed');
  const response = NextResponse.redirect(resetTarget(next), 303);
  const hostname = new URL(siteUrls.app).hostname;
  for (const cookie of cookies) response.cookies.set(cookie.name, cookie.value, sessionCookieOptions(cookie.options, hostname));
  // Clear old host-only auth cookies which otherwise compete with the shared
  // portal cookie after switching from an existing administrator session.
  if (hostname.endsWith('.elevateforhumanity.org')) {
    for (const cookie of cookies) {
      if (cookie.name.startsWith('sb-') && cookie.name.includes('-auth-token')) {
        response.headers.append('Set-Cookie', cookie.name + '=; Path=/; Max-Age=0; Secure; SameSite=Lax');
      }
    }
  }
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
