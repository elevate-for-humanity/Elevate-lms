import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * LinkedIn OAuth Callback Handler
 * Exchanges authorization code for access token
 */
export async function GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');

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
    // Exchange code for access token
    const tokenResponse = await fetch(
      'https://www.linkedin.com/oauth/v2/accessToken',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
          redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/linkedin/callback`,
        }),
      }
    );

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      return NextResponse.redirect(
        new URL(
          `/admin/settings/social-media?error=token_exchange_failed`,
          request.url
        )
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, expires_in } = tokenData;

    // Get organization/company info
    const profileResponse = await fetch('https://api.linkedin.com/v2/me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const profileData = await profileResponse.json();

    // Get organization pages the user can manage
    const organizationsResponse = await fetch(
      'https://api.linkedin.com/v2/organizationAcls?q=roleAssignee&role=ADMINISTRATOR&projection=(elements*(organization~(id,localizedName)))',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const organizationsData = await organizationsResponse.json();
    const organizations = organizationsData.elements || [];

    // Store in database
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL('/admin/settings/social-media?error=unauthorized', request.url)
      );
    }

    // Save to settings table
    const { error: saveError } = await supabase
      .from('social_media_settings')
      .upsert({
        platform: 'linkedin',
        access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        profile_data: profileData,
        organizations: organizations,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      });

    if (saveError) {
      return NextResponse.redirect(
        new URL(`/admin/settings/social-media?error=save_failed`, request.url)
      );
    }

    return NextResponse.redirect(
      new URL(
        '/admin/settings/social-media?success=linkedin_connected',
        request.url
      )
    );
  } catch (error) {
    return NextResponse.redirect(
      new URL(
        `/admin/settings/social-media?error=unexpected_error`,
        request.url
      )
    );
  }
}
