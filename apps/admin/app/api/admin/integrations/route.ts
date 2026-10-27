import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
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

  const db = await requireAdminClient();
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
  if (!provider) return safeError('Provider is required', 400);
  logger.info(`[integrations] sync triggered for provider=${provider} by user=${auth.id}`);

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data: integration, error } = await db
    .from('integrations')
    .select('id,slug,status,is_active')
    .eq('slug', provider)
    .maybeSingle();
  if (error) return safeDbError(error, 'Failed to inspect integration');
  if (!integration) return safeError('Integration is not configured', 404);
  if (integration.status !== 'active' || integration.is_active !== true) {
    return safeError('Integration must be connected and verified before synchronization', 409);
  }
  return NextResponse.json(
    { success: false, error: `No production sync adapter is registered for ${provider}` },
    { status: 501 },
  );
}
