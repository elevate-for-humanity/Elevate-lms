import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'auth');
  if (rateLimited) return rateLimited;

  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const returnedState = searchParams.get('state');

  const base = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  const redirect = (msg: string) =>
    NextResponse.redirect(`${base}/admin/settings/social-media?${msg}`);

  if (error) return redirect(`error=${error}`);

  const storedState = request.cookies.get('oauth_state_twitter')?.value;
  const codeVerifier = request.cookies.get('oauth_pkce_twitter')?.value;

  if (!storedState || returnedState !== storedState || !codeVerifier) {
    return redirect('error=invalid_state');
  }
  if (!code) return redirect('error=no_code');

  try {
    const clientId = process.env.TWITTER_CLIENT_ID || process.env.TWITTER_API_KEY!;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET || process.env.TWITTER_API_SECRET!;
    const redirectUri = `${base}/api/auth/twitter/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) return redirect('error=token_failed');

    const { access_token, refresh_token, expires_in } = tokenData;

    // Get Twitter user info
    const userRes = await fetch('https://api.twitter.com/2/users/me?user.fields=name,username,profile_image_url', {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    const userData = await userRes.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('error=unauthorized');

    const { error: saveError } = await supabase.from('social_media_settings').upsert({
      platform: 'twitter',
      access_token,
      refresh_token: refresh_token ?? null,
      expires_at: expires_in
        ? new Date(Date.now() + expires_in * 1000).toISOString()
        : new Date(Date.now() + 7200 * 1000).toISOString(),
      profile_data: userData?.data ?? {},
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'platform' });

    if (saveError) return redirect('error=save_failed');

    const successRes = NextResponse.redirect(`${base}/admin/settings/social-media?success=twitter_connected`);
    successRes.cookies.set('oauth_state_twitter', '', { maxAge: 0, path: '/' });
    successRes.cookies.set('oauth_pkce_twitter', '', { maxAge: 0, path: '/' });
    return successRes;
  } catch {
    return redirect('error=unexpected');
  }
}

export const GET = withApiAudit('/api/auth/twitter/callback', _GET);
