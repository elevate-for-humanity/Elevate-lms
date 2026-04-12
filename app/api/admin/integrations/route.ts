import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const provider = new URL(request.url).searchParams.get('provider');

  const db = await getAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('integrations')
    .select('id, slug, status, is_active, updated_at')
    .eq('slug', provider ?? '')
    .maybeSingle();

  if (error) return safeDbError(error, 'Failed to fetch integration status');

  return NextResponse.json({
    connected: data?.is_active ?? false,
    status: data?.status ?? 'not_configured',
    last_sync: data?.updated_at ?? null,
    contacts: 0,
    leads: 0,
  });
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const provider = new URL(request.url).searchParams.get('provider');
  logger.info(`[integrations] sync triggered for provider=${provider} by user=${auth.user.id}`);

  const db = await getAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  // Update last sync timestamp
  await db
    .from('integrations')
    .update({ updated_at: new Date().toISOString() })
    .eq('slug', provider ?? '');

  return NextResponse.json({ success: true, message: `Sync triggered for ${provider}` });
}
