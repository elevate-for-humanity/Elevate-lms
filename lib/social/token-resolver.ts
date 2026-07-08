/**
 * Resolves OAuth tokens for social media platforms.
 * Reads from social_media_settings table (set via OAuth connect flow).
 * Falls back to env vars for backward compatibility.
 */

export interface SocialTokens {
  access_token: string;
  refresh_token?: string | null;
  expires_at?: string | null;
  organization_id?: string | null;
  profile_data?: Record<string, unknown> | null;
}

export async function getSocialTokens(platform: string): Promise<SocialTokens | null> {
  try {
    const { requireAdminClient } = await import('@/lib/supabase/admin');
    const db = await requireAdminClient();

    const { data, error } = await db
      .from('social_media_settings')
      .select('access_token, refresh_token, expires_at, organization_id, profile_data')
      .eq('platform', platform)
      .maybeSingle();

    if (error || !data?.access_token) return getEnvFallback(platform);

    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      // Try to refresh if we have a refresh token
      const refreshed = await tryRefresh(platform, data.refresh_token);
      if (refreshed) return refreshed;
      return null;
    }

    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at,
      organization_id: data.organization_id,
      profile_data: data.profile_data as Record<string, unknown> | null,
    };
  } catch {
    return getEnvFallback(platform);
  }
}

function getEnvFallback(platform: string): SocialTokens | null {
  switch (platform) {
    case 'facebook':
      if (!process.env.FACEBOOK_ACCESS_TOKEN) return null;
      return { access_token: process.env.FACEBOOK_ACCESS_TOKEN, organization_id: process.env.FACEBOOK_PAGE_ID };
    case 'instagram':
      if (!process.env.INSTAGRAM_ACCESS_TOKEN) return null;
      return { access_token: process.env.INSTAGRAM_ACCESS_TOKEN, organization_id: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID };
    case 'youtube':
      if (!process.env.YOUTUBE_API_KEY) return null;
      return { access_token: process.env.YOUTUBE_API_KEY, organization_id: process.env.YOUTUBE_CHANNEL_ID };
    case 'twitter':
      if (!process.env.TWITTER_ACCESS_TOKEN) return null;
      return { access_token: process.env.TWITTER_ACCESS_TOKEN };
    case 'linkedin':
      if (!process.env.LINKEDIN_ACCESS_TOKEN) return null;
      return { access_token: process.env.LINKEDIN_ACCESS_TOKEN };
    default:
      return null;
  }
}

async function tryRefresh(platform: string, refreshToken: string | null): Promise<SocialTokens | null> {
  if (!refreshToken) return null;

  try {
    let tokenData: Record<string, unknown> | null = null;

    if (platform === 'youtube') {
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
      });
      if (res.ok) tokenData = await res.json();
    } else if (platform === 'linkedin') {
      const res = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.LINKEDIN_CLIENT_ID!,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
        }),
      });
      if (res.ok) tokenData = await res.json();
    } else if (platform === 'twitter') {
      const clientId = process.env.TWITTER_CLIENT_ID || process.env.TWITTER_API_KEY!;
      const clientSecret = process.env.TWITTER_CLIENT_SECRET || process.env.TWITTER_API_SECRET!;
      const res = await fetch('https://api.twitter.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        },
        body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken }),
      });
      if (res.ok) tokenData = await res.json();
    }

    if (!tokenData?.access_token) return null;

    // Persist refreshed token
    const { requireAdminClient } = await import('@/lib/supabase/admin');
    const db = await requireAdminClient();
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
      : null;

    await db.from('social_media_settings').update({
      access_token: tokenData.access_token as string,
      refresh_token: (tokenData.refresh_token as string) ?? refreshToken,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }).eq('platform', platform);

    return {
      access_token: tokenData.access_token as string,
      refresh_token: (tokenData.refresh_token as string) ?? refreshToken,
      expires_at: expiresAt,
    };
  } catch {
    return null;
  }
}
