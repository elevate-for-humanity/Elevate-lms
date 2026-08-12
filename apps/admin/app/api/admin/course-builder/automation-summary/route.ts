import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const courseId = request.nextUrl.searchParams.get('courseId');
  if (!courseId) return safeError('courseId is required', 400);

  try {
    const db = await requireAdminClient();
    const { data: course, error: courseError } = await db
      .from('courses')
      .select('id,org_id')
      .eq('id', courseId)
      .maybeSingle();
    if (courseError) throw courseError;
    if (!course) return safeError('Course not found', 404);

    const rulesPromise = db
      .from('automation_rules')
      .select('id,name,description,status,trigger_type,action_type,enabled,run_count,last_triggered_at,created_at,trigger_config,action_config')
      .order('created_at', { ascending: false })
      .limit(50);

    let workflowsQuery = db
      .from('workflows')
      .select('id,name,workflow_key,category,status,last_run_at,last_run_status,run_count,created_at,tenant_id,metadata')
      .order('created_at', { ascending: false })
      .limit(50);
    if (course.org_id) workflowsQuery = workflowsQuery.eq('tenant_id', course.org_id) as typeof workflowsQuery;

    const [rulesRes, workflowsRes] = await Promise.all([rulesPromise, workflowsQuery]);
    if (rulesRes.error) throw rulesRes.error;
    if (workflowsRes.error) throw workflowsRes.error;

    const courseRules = (rulesRes.data ?? []).filter((rule: any) => {
      const serialized = JSON.stringify({ trigger: rule.trigger_config, action: rule.action_config });
      return serialized.includes(courseId);
    });

    return NextResponse.json({
      ok: true,
      courseScopedRules: courseRules,
      recentRules: rulesRes.data ?? [],
      workflows: workflowsRes.data ?? [],
      workflowScope: course.org_id ? 'organization' : 'platform',
      note: 'automation_rules has no tenant/course foreign-key column; course-scoped rules are detected from rule configuration payloads.',
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to load course automation summary');
  }
}
