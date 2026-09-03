import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeInternalError } from '@/lib/api/safe-error';
import { isMissingTable, jsonOk, tableNotReadyResponse } from '@/lib/devstudio/os/api-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10), 200);
  const action = request.nextUrl.searchParams.get('action');
  const resourceType = request.nextUrl.searchParams.get('resourceType');

  try {
    const db = await requireAdminClient();
    let query = db
      .from('dev_audit_logs')
      .select('id, actor_id, action, resource_type, resource_id, trace_id, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (action) query = query.ilike('action', `%${action}%`);
    if (resourceType) query = query.eq('resource_type', resourceType);

    const { data, error } = await query;
    if (error) {
      if (isMissingTable(error)) return tableNotReadyResponse();
      throw error;
    }

    return jsonOk({ logs: data ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to load audit logs');
  }
}
