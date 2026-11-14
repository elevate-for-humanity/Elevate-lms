import { NextRequest } from 'next/server';

import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { isMissingTable, jsonOk } from '@/lib/devstudio/os/api-helpers';
import { requireAdminClient } from '@/lib/supabase/admin';

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
      .from('ai_eval_runs')
      .select(
        'id,suite,status,git_sha,git_ref,provider,model,quality_threshold,average_quality_score,total_cases,passed_cases,failed_cases,metadata,started_at,completed_at',
      )
      .order('started_at', { ascending: false })
      .limit(50);

    if (error) {
      if (isMissingTable(error)) {
        return jsonOk({
          ok: true,
          runs: [],
          source: null,
          notice: 'Evaluation storage is not provisioned yet.',
        });
      }
      throw error;
    }

    const runs = (data ?? []).map((run) => {
      const metadata =
        run.metadata && typeof run.metadata === 'object' && !Array.isArray(run.metadata)
          ? (run.metadata as Record<string, unknown>)
          : {};
      return {
        id: run.id,
        evaluation_type: run.suite,
        resource_type: 'evaluation-suite',
        resource_id: run.git_sha || run.git_ref || run.suite,
        status: run.status,
        score: run.average_quality_score,
        findings: Array.isArray(metadata.findings) ? metadata.findings : [],
        created_at: run.started_at,
        completed_at: run.completed_at,
        provider: run.provider,
        model: run.model,
        total_cases: run.total_cases,
        passed_cases: run.passed_cases,
        failed_cases: run.failed_cases,
        quality_threshold: run.quality_threshold,
      };
    });

    return jsonOk({ ok: true, runs, source: 'ai_eval_runs' });
  } catch (error) {
    return safeInternalError(error, 'Failed to load evaluations');
  }
}
