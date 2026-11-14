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

  const storedState = request.cookies.get('oauth_state_instagram')?.value;
  if (!storedState || returnedState !== storedState) return redirect('error=invalid_state');
  if (!code) return redirect('error=no_code');

  try {
    const clientId = process.env.FACEBOOK_CLIENT_ID!;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET!;
    const redirectUri = `${base}/api/auth/instagram/callback`;

    // Exchange code for user access token
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', clientId);
    tokenUrl.searchParams.set('client_secret', clientSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) return redirect('error=token_failed');

    const { access_token } = tokenData;

    // Get Facebook pages to find linked Instagram Business Account
    const pagesRes = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account&access_token=${access_token}`,
    );
    const pagesData = await pagesRes.json();
    const pages = pagesData.data ?? [];

    // Find first page with a linked Instagram account
    const pageWithIg = pages.find((p: any) => p.instagram_business_account);
    const igAccountId = pageWithIg?.instagram_business_account?.id ?? null;
    const pageAccessToken = pageWithIg
      ? await getPageToken(pageWithIg.id, access_token)
      : access_token;

    // Get Instagram account details
    let igProfile: Record<string, unknown> = {};
    if (igAccountId) {
      const igRes = await fetch(
        `https://graph.facebook.com/v18.0/${igAccountId}?fields=id,name,username,profile_picture_url&access_token=${pageAccessToken}`,
      );
      igProfile = await igRes.json();
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect('error=unauthorized');

    const { error: saveError } = await supabase.from('social_media_settings').upsert({
      platform: 'instagram',
      access_token: pageAccessToken,
      expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
      profile_data: igProfile,
      organization_id: igAccountId,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'platform' });

    if (saveError) return redirect('error=save_failed');

    const successRes = NextResponse.redirect(`${base}/admin/settings/social-media?success=instagram_connected`);
    successRes.cookies.set('oauth_state_instagram', '', { maxAge: 0, path: '/' });
    return successRes;
  } catch {
    return redirect('error=unexpected');
  }
}

async function getPageToken(pageId: string, userToken: string): Promise<string> {
  const res = await fetch(
    `https://graph.facebook.com/v18.0/${pageId}?fields=access_token&access_token=${userToken}`,
  );
  const data = await res.json();
  return data.access_token ?? userToken;
}

export const GET = withApiAudit('/api/auth/instagram/callback', _GET);
