import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { isMissingTable, jsonOk, tableNotReadyResponse } from '@/lib/devstudio/os/api-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const scope = request.nextUrl.searchParams.get('scope') ?? undefined;
  const key = request.nextUrl.searchParams.get('key') ?? undefined;
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10), 200);

  try {
    const db = await requireAdminClient();
    let query = db
      .from('ai_memory')
      .select('id, scope, key, content, agent_id, task_id, metadata, updated_at')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (scope) query = query.eq('scope', scope);
    if (key) query = query.ilike('key', `%${key}%`);

    const { data, error } = await query;
    if (error) {
      if (isMissingTable(error)) return tableNotReadyResponse();
      throw error;
    }

    return jsonOk({ memories: data ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to load memory');
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    const key = String(body.key ?? '').trim();
    const content = String(body.content ?? '').trim();
    if (!key || !content) return safeError('key and content are required', 400);

    const scope = String(body.scope ?? 'platform');
    const db = await requireAdminClient();
    const row = {
      scope,
      key,
      content,
      agent_id: body.agentId ?? null,
      task_id: body.taskId ?? null,
      metadata: { ...(body.metadata ?? {}), created_by: auth.id },
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await db
      .from('ai_memory')
      .upsert(row, { onConflict: 'scope,key,agent_id' })
      .select('*')
      .single();

    if (error) {
      if (isMissingTable(error)) return tableNotReadyResponse();
      throw error;
    }

    return jsonOk({ memory: data }, { status: 201 });
  } catch (err) {
    return safeInternalError(err, 'Failed to save memory');
  }
}
