import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

/**
 * Facebook OAuth Callback
 * Exchanges code for access token and stores in database
 */
async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const returnedState = searchParams.get('state');

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/settings/social-media?error=${error}`, request.url)
    );
  }

  // Validate state against the cookie set in the authorize route.
  const storedState = request.cookies.get('oauth_state_facebook')?.value;
  if (!storedState || !returnedState || storedState !== returnedState) {
    return NextResponse.redirect(
      new URL('/admin/settings/social-media?error=invalid_state', request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/admin/settings/social-media?error=no_code', request.url)
    );
  }

  try {
    const clientId = process.env.FACEBOOK_CLIENT_ID;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/facebook/callback`;

    // Exchange code for access token
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', clientId!);
    tokenUrl.searchParams.set('client_secret', clientSecret!);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl.toString());
    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      return NextResponse.redirect(
        new URL('/admin/settings/social-media?error=token_failed', request.url)
      );
    }

    const { access_token } = tokenData;

    // Get user's pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${access_token}`
    );
    const pagesData = await pagesResponse.json();

    // Store in database
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL('/admin/settings/social-media?error=unauthorized', request.url)
      );
    }

    // Save to settings table
    const { error: saveError } = await supabase
      .from('social_media_settings')
      .upsert({
        platform: 'facebook',
        access_token,
        expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
        profile_data: pagesData,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      });

    if (saveError) {
      return NextResponse.redirect(
        new URL('/admin/settings/social-media?error=save_failed', request.url)
      );
    }

    // Clear the state cookie — it is single-use.
    const successResponse = NextResponse.redirect(
      new URL('/admin/settings/social-media?success=facebook_connected', request.url)
    );
    successResponse.cookies.set('oauth_state_facebook', '', { maxAge: 0, path: '/' });
    return successResponse;
  } catch (error) {
    return NextResponse.redirect(
      new URL('/admin/settings/social-media?error=unexpected', request.url)
    );
  }
}
export const GET = withApiAudit('/api/auth/facebook/callback', _GET);
