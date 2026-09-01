import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { createAiTask } from '@/lib/devstudio/os/task-runner';
import { isMissingTable, jsonOk, tableNotReadyResponse } from '@/lib/devstudio/os/api-helpers';
import { resolveTenantIdForUser } from '@/lib/platform/resolve-tenant-for-user';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '30', 10), 100);
  const status = request.nextUrl.searchParams.get('status');

  try {
    const db = await requireAdminClient();
    let query = db
      .from('ai_tasks')
      .select('id, title, description, status, priority, agent_id, agent_type, trace_id, tool_name, requires_approval, approval_status, risk_tags, result_json, error_message, created_at, updated_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);

    const [{ data, error }, { data: agenticRuns, error: agenticError }] = await Promise.all([
      query,
      db
        .from('agentic_build_runs')
        .select('id,project_id,prompt,status,credits_used,error,created_at,started_at,completed_at')
        .order('created_at', { ascending: false })
        .limit(limit),
    ]);
    if (error) {
      if (isMissingTable(error)) return tableNotReadyResponse();
      throw error;
    }

    if (agenticError && !isMissingTable(agenticError)) throw agenticError;

    const projectIds = [...new Set((agenticRuns ?? []).map((run) => run.project_id).filter(Boolean))];
    const { data: projects, error: projectsError } = projectIds.length
      ? await db
          .from('agentic_build_projects')
          .select('id,title,target_type,target_id,user_id')
          .in('id', projectIds)
      : { data: [], error: null };
    if (projectsError && !isMissingTable(projectsError)) throw projectsError;
    const projectById = new Map((projects ?? []).map((project) => [project.id, project]));
    const visibleRuns = (agenticRuns ?? []).filter((run) => {
      const project = projectById.get(run.project_id);
      return project && (project.user_id === auth.id || auth.effectiveRoles.includes('super_admin'));
    });
    const normalizedAgenticTasks = visibleRuns.map((run) => {
      const project = projectById.get(run.project_id)!;
      return {
        id: run.id,
        project_id: run.project_id,
        source: 'agentic_build',
        title: project.title || `${project.target_type} build`,
        description: run.prompt,
        status: run.status === 'waiting_for_approval' ? 'awaiting_approval' : run.status,
        priority: 'medium',
        requires_approval: run.status === 'waiting_for_approval',
        approval_reason: run.status === 'waiting_for_approval' ? 'Course acceptance review is required.' : null,
        ai_agents: { name: 'Course Builder AI', role: project.target_type },
        error_message: run.error,
        credits_used: run.credits_used,
        target_type: project.target_type,
        target_id: project.target_id,
        created_at: run.created_at,
        updated_at: run.completed_at ?? run.started_at ?? run.created_at,
        completed_at: run.completed_at,
      };
    });
    const normalizedTasks = (data ?? []).map((task) => ({ ...task, source: 'ai_task' }));
    const tasks = [...normalizedTasks, ...normalizedAgenticTasks]
      .sort((left, right) => String(right.created_at).localeCompare(String(left.created_at)))
      .slice(0, limit);

    return jsonOk({ tasks });
  } catch (err) {
    return safeInternalError(err, 'Failed to load tasks');
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    const title = String(body.title ?? '').trim();
    if (!title) return safeError('title is required', 400);

    const db = await requireAdminClient();
    const tenantId = await resolveTenantIdForUser(auth.id).catch(() => null);
    const task = await createAiTask(
      db,
      {
        title,
        description: body.description ? String(body.description) : undefined,
        agentSlug: body.agentSlug ? String(body.agentSlug) : undefined,
        command: body.command ? String(body.command) : undefined,
        requestedBy: auth.id,
        priority: typeof body.priority === 'number' ? body.priority : undefined,
        traceId: body.traceId ? String(body.traceId) : undefined,
      },
      {
        actorRoles: auth.effectiveRoles,
        tenantId,
        requestHeaders: request.headers,
        adminOrigin: request.nextUrl.origin,
        appOrigin: process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org',
      },
    );

    return jsonOk({ task }, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Failed to create task');
  }
}
