import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeDbError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';
import { summarizeSyncEvidence } from '@/lib/integrations/sync-evidence';
import { ClassroomSyncError, readConnectedClassroomCourses, synchronizeGoogleClassroom } from '@/lib/integrations/google-classroom-sync';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const provider = new URL(request.url).searchParams.get('provider');
  if (!provider) return safeError('Provider is required', 400);

  const db = await requireAdminClient();
  if (!db) return safeError('Service unavailable', 503);

  const { data, error } = await db
    .from('integrations')
    .select('id, slug, status, is_active, updated_at')
    .eq('slug', provider ?? '')
    .maybeSingle();

  if (error) return safeDbError(error, 'Failed to fetch integration status');

  let syncQuery = db
    .from('integration_sync_log')
    .select('action,status,records,created_at')
    .eq('provider', provider);
  if (provider === 'google-classroom') syncQuery = syncQuery.contains('records', { actorId: auth.id });
  const { data: syncRows, error: syncError } = await syncQuery
    .order('created_at', { ascending: false })
    .limit(100);
  if (syncError) return safeDbError(syncError, 'Failed to fetch synchronization evidence');

  let verified = false;
  if (provider === 'google-classroom') {
    try { await readConnectedClassroomCourses(db, auth.id); verified = true; }
    catch (error) {
      if (!(error instanceof ClassroomSyncError && error.status === 409))
        return safeError('Google Classroom connection could not be verified', 503);
    }
  }

  return NextResponse.json({
    // This legacy table contains configuration only, never live provider proof.
    connected: verified,
    connection_verified: verified,
    enabled: data?.is_active ?? false,
    status: verified ? 'connected' : data ? 'unverified' : 'not_configured',
    configuration_updated_at: data?.updated_at ?? null,
    ...summarizeSyncEvidence(syncRows ?? []),
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

  if (provider === 'google-classroom') {
    try { return NextResponse.json(await synchronizeGoogleClassroom(db, auth.id), { headers: { 'Cache-Control': 'no-store' } }); }
    catch (error) {
      if (error instanceof ClassroomSyncError) return safeError(error.message, error.status);
      return safeError('Google Classroom synchronization failed', 502);
    }
  }

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
