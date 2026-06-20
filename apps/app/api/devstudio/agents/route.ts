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

  try {
    const db = await requireAdminClient();
    const { data, error } = await db
      .from('ai_agents')
      .select('id, slug, name, description, capabilities, status, model_hint, updated_at')
      .order('name', { ascending: true });

    if (error) {
      if (isMissingTable(error)) return tableNotReadyResponse();
      throw error;
    }

    return jsonOk({ agents: data ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to load agents');
  }
}
