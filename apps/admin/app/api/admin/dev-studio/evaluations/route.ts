import { NextRequest } from 'next/server';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { isMissingTable, jsonOk } from '@/lib/devstudio/os/api-helpers';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EVALUATION_TABLES = ['ai_evaluation_runs', 'evaluation_runs'] as const;

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const db = await requireAdminClient();

    for (const table of EVALUATION_TABLES) {
      const { data, error } = await db
        .from(table)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!error) {
        return jsonOk({ runs: data ?? [], source: table });
      }

      if (!isMissingTable(error)) throw error;
    }

    return jsonOk({
      runs: [],
      source: null,
      notice: 'Evaluation storage is not provisioned yet.',
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to load evaluations');
  }
}
