import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * YouTube/Google OAuth Callback
 * Exchanges code for access token and stores in database
 */
async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/settings/social-media?error=${error}`, request.url)
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/admin/settings/social-media?error=no_code', request.url)
    );
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/youtube/callback`;

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      return NextResponse.redirect(
        new URL('/admin/settings/social-media?error=token_failed', request.url)
      );
    }

    const { access_token, refresh_token, expires_in } = tokenData;

    // Get channel info
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true`,
      {
        headers: { Authorization: `Bearer ${access_token}` },
      }
    );
    const channelData = await channelResponse.json();

    // Store in database
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL('/admin/settings/social-media?error=unauthorized', request.url)
      );
    }

    // Save to settings table
    const { error: saveError } = await db
      .from('social_media_settings')
      .upsert({
        platform: 'youtube',
        access_token,
        refresh_token,
        expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        profile_data: channelData,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      });

    if (saveError) {
      return NextResponse.redirect(
        new URL('/admin/settings/social-media?error=save_failed', request.url)
      );
    }

    return NextResponse.redirect(
      new URL('/admin/settings/social-media?success=youtube_connected', request.url)
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL('/admin/settings/social-media?error=unexpected', request.url)
    );
  }
}
export const GET = withApiAudit('/api/auth/youtube/callback', _GET);
