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
      .select('platform, enabled, expires_at, profile_data, organization_id, updated_at, granted_scopes, connection_status, last_verified_at, dry_run');

    if (error) throw error;

    const statuses = (data ?? []).map((row) => {
      const expired = row.expires_at ? new Date(row.expires_at) < new Date() : false;
      return {
        platform: row.platform,
        connected: row.enabled === true && row.connection_status === 'verified_read_only' && !expired,
        expired,
        expires_at: row.expires_at,
        profile_data: row.profile_data,
        organization_id: row.organization_id,
        updated_at: row.updated_at,
        granted_scopes: row.granted_scopes,
        connection_status: row.connection_status,
        last_verified_at: row.last_verified_at,
        dry_run: row.dry_run !== false,
      };
    });

    // Include disconnected platforms with connected: false
    const connected = new Set(statuses.map((s) => s.platform));
    const all = ['facebook', 'instagram', 'google_business', 'youtube', 'linkedin'];
    for (const p of all) {
      if (!connected.has(p)) statuses.push({ platform: p, connected: false, expired: false, expires_at: null, profile_data: null, organization_id: null, updated_at: null, granted_scopes: [], connection_status: 'not_connected', last_verified_at: null, dry_run: true });
    }

    return NextResponse.json({ statuses });
  } catch (err) {
    return safeInternalError(err, 'Failed to load social media status');
  }
}
