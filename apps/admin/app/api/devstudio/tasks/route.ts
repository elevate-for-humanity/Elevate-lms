import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { createAiTask } from '@/lib/devstudio/os/task-runner';
import { isMissingTable, jsonOk, tableNotReadyResponse } from '@/lib/devstudio/os/api-helpers';

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
      .select(
        'id, title, description, status, priority, agent_id, trace_id, requires_approval, risk_tags, created_at, updated_at, completed_at',
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) {
      if (isMissingTable(error)) return tableNotReadyResponse();
      throw error;
    }

    return jsonOk({ tasks: data ?? [] });
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
    const task = await createAiTask(db, {
      title,
      description: body.description ? String(body.description) : undefined,
      agentSlug: body.agentSlug ? String(body.agentSlug) : undefined,
      command: body.command ? String(body.command) : undefined,
      requestedBy: auth.id,
      priority: typeof body.priority === 'number' ? body.priority : undefined,
      traceId: body.traceId ? String(body.traceId) : undefined,
    });

    return jsonOk({ task }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create task';
    if (message.includes('not found') && message.includes('ai_')) {
      return tableNotReadyResponse();
    }
    return safeInternalError(err, 'Failed to create task');
  }
}
