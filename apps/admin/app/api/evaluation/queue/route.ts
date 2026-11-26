/**
 * GET /api/evaluation/queue
 *
 * Review queue for the AI Evaluation Studio (/evaluation page): the most
 * recent failed evaluation results from ai_eval_results, mapped to the
 * queue-item shape the page renders.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Unauthorized', 401);

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    return safeError('Forbidden', 403);
  }

  const { data, error } = await db
    .from('ai_eval_results')
    .select('id, run_id, case_id, category, passed, error_message, assertions, created_at')
    .eq('passed', false)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return safeInternalError(error, 'Failed to load evaluation queue');

  return NextResponse.json({
    data: (data ?? []).map((r) => {
      const reasons: string[] = [];
      if (r.error_message) reasons.push(String(r.error_message));
      const assertions = Array.isArray(r.assertions) ? r.assertions : [];
      for (const a of assertions as Array<Record<string, unknown>>) {
        if (a && a.passed === false && a.name) reasons.push(String(a.name));
      }
      return {
        id: r.id,
        resultId: r.id,
        taskId: r.case_id ?? '',
        status: 'needs_review',
        priority: 'normal',
        failureReasons: reasons,
        createdAt: r.created_at,
      };
    }),
  });
}
