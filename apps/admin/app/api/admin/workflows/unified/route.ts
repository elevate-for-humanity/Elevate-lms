import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UnifiedWorkflow {
  id: string;
  title: string;
  description: string | null;
  type: 'ai_task' | 'general';
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_run_at: string | null;
  last_run_status: string | null;
  run_count: number;
  prompt?: string | null;
  agent_name?: string | null;
  workflow_key?: string | null;
  trigger_count?: number;
  step_count?: number;
}

async function authorize(request: NextRequest, bucket: 'api' | 'strict') {
  const rateLimited = await applyRateLimit(request, bucket);
  if (rateLimited) return { error: rateLimited };
  try {
    const auth = await apiRequireAdmin(request);
    if (auth.error) return { error: auth.error };
    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Response
        ? error
        : NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
}

export async function GET(request: NextRequest) {
  const auth = await authorize(request, 'api');
  if (auth.error) return auth.error;
  const db = await requireAdminClient();

  try {
    const [generalWorkflows, aiTasks] = await Promise.all([
      db.from('workflows').select('*').order('created_at', { ascending: false }).limit(100)
        .then(({ data, error }) => {
          if (error) throw error;
          return (data ?? []).map((w): UnifiedWorkflow => ({
            id: w.id,
            title: w.name,
            description: (w.metadata as Record<string, unknown> | null)?.description as string ?? null,
            type: 'general',
            category: w.category ?? 'system',
            status: w.status ?? 'inactive',
            created_at: w.created_at,
            updated_at: w.last_run_at ?? w.updated_at ?? w.created_at,
            last_run_at: w.last_run_at ?? null,
            last_run_status: w.last_run_status ?? null,
            run_count: w.run_count ?? 0,
            workflow_key: w.workflow_key ?? null,
            trigger_count: w.trigger_count ?? 0,
            step_count: w.step_count ?? 0,
          }));
        }),
      db.from('ai_tasks').select('*').order('created_at', { ascending: false }).limit(100)
        .then(({ data, error }) => {
          if (error) throw error;
          return (data ?? []).map((t): UnifiedWorkflow => {
            const config = (t.config ?? {}) as Record<string, unknown>;
            return {
              id: t.id,
              title: t.title ?? 'Untitled Task',
              description: typeof config.prompt === 'string' ? config.prompt : null,
              type: 'ai_task',
              category: 'ai',
              status: t.status ?? 'pending',
              created_at: t.created_at,
              updated_at: t.updated_at ?? t.created_at,
              last_run_at: t.updated_at ?? null,
              last_run_status: t.status ?? null,
              run_count: 1,
              prompt: typeof config.prompt === 'string' ? config.prompt : null,
              agent_name: typeof config.agent_name === 'string' ? config.agent_name : null,
            };
          });
        }),
    ]);

    const workflows = [...generalWorkflows, ...aiTasks].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return NextResponse.json({ workflows, total: workflows.length });
  } catch (error) {
    console.error('[admin/workflows/unified] load failed', error);
    return NextResponse.json({ error: 'Failed to load workflows' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorize(request, 'strict');
  if (auth.error) return auth.error;
  const db = await requireAdminClient();
  const body = await request.json().catch(() => null);
  if (!body || !['ai_task', 'general'].includes(body.type)) {
    return NextResponse.json({ error: 'Invalid workflow type' }, { status: 400 });
  }
  const title = String(body.title ?? body.name ?? '').trim();
  if (!title) return NextResponse.json({ error: 'Workflow title is required' }, { status: 400 });

  if (body.type === 'ai_task') {
    const { error } = await db.from('ai_tasks').insert({
      title,
      status: 'pending',
      config: { prompt: body.prompt ?? '', agent_name: body.agent_name ?? null },
    });
    if (error) return NextResponse.json({ error: 'Failed to create AI task' }, { status: 500 });
    return NextResponse.json({ status: 'ok', type: 'ai_task' }, { status: 201 });
  }

  const { error } = await db.from('workflows').insert({
    name: title,
    category: body.category ?? 'system',
    status: 'inactive',
    metadata: {},
  });
  if (error) return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  return NextResponse.json({ status: 'ok', type: 'general' }, { status: 201 });
}
