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
  dry_run: boolean;
  connection_status?: string | null;
}

export async function getSocialTokens(platform: string): Promise<SocialTokens | null> {
  try {
    const { requireAdminClient } = await import('@/lib/supabase/admin');
    const db = await requireAdminClient();

    const { data: rawData, error } = await db
      .rpc('resolve_social_credentials', { p_platform: platform })
      .maybeSingle();
    const data =
      rawData && typeof rawData === 'object' ? (rawData as Partial<SocialTokens>) : null;

    if (error || !data?.access_token) return null;

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
      dry_run: data.dry_run !== false,
      connection_status: data.connection_status,
    };
  } catch {
    return null;
  }
}

async function tryRefresh(platform: string, refreshToken: string | null): Promise<SocialTokens | null> {
  if (!refreshToken) return null;

  try {
    let tokenData: Record<string, unknown> | null = null;

    if (platform === 'youtube' || platform === 'google_business') {
      const clientId = platform === 'google_business'
        ? process.env.GOOGLE_BUSINESS_CLIENT_ID || process.env.GOOGLE_CLIENT_ID
        : process.env.GOOGLE_CLIENT_ID;
      const clientSecret = platform === 'google_business'
        ? process.env.GOOGLE_BUSINESS_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET
        : process.env.GOOGLE_CLIENT_SECRET;
      if (!clientId || !clientSecret) return null;
      const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
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
    }

    if (!tokenData?.access_token) return null;

    // Persist refreshed token
    const { requireAdminClient } = await import('@/lib/supabase/admin');
    const db = await requireAdminClient();
    const expiresAt = tokenData.expires_in
      ? new Date(Date.now() + Number(tokenData.expires_in) * 1000).toISOString()
      : null;

    const { error } = await db.rpc('refresh_social_credentials', {
      p_platform: platform,
      p_access_token: tokenData.access_token as string,
      p_refresh_token: (tokenData.refresh_token as string) ?? refreshToken,
      p_expires_at: expiresAt,
    });
    if (error) return null;

    return {
      access_token: tokenData.access_token as string,
      refresh_token: (tokenData.refresh_token as string) ?? refreshToken,
      expires_at: expiresAt,
      dry_run: true,
    };
  } catch {
    return null;
  }
}
