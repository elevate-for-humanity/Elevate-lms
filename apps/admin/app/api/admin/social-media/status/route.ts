import { NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('social_media_settings')
      .select('platform, access_token, expires_at, profile_data, organization_id, updated_at');

    if (error) throw error;

    const statuses = (data ?? []).map((row) => {
      const expired = row.expires_at ? new Date(row.expires_at) < new Date() : false;
      return {
        platform: row.platform,
        connected: !!row.access_token && !expired,
        expired,
        expires_at: row.expires_at,
        profile_data: row.profile_data,
        organization_id: row.organization_id,
        updated_at: row.updated_at,
      };
    });

    // Include disconnected platforms with connected: false
    const connected = new Set(statuses.map((s) => s.platform));
    const all = ['facebook', 'instagram', 'youtube', 'linkedin'];
    for (const p of all) {
      if (!connected.has(p)) statuses.push({ platform: p, connected: false, expired: false, expires_at: null, profile_data: null, organization_id: null, updated_at: null });
    }

    return NextResponse.json({ statuses });
  } catch (err) {
    return safeInternalError(err, 'Failed to load social media status');
  }
}
