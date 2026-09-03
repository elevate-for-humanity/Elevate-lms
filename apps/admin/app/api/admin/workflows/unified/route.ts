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

  try {
    const db = await requireAdminClient();
    const warnings: string[] = [];

    const [generalResult, aiResult] = await Promise.all([
      db.from('workflows').select('*').order('created_at', { ascending: false }).limit(100),
      db.from('ai_tasks').select('*').order('created_at', { ascending: false }).limit(100),
    ]);

    let generalWorkflows: UnifiedWorkflow[] = [];
    let aiTasks: UnifiedWorkflow[] = [];

    if (generalResult.error) {
      console.error('[admin/workflows/unified] workflows query failed', generalResult.error);
      warnings.push('General workflow records are temporarily unavailable.');
    } else {
      generalWorkflows = (generalResult.data ?? []).map((w): UnifiedWorkflow => {
        const triggerCount = Number(w.trigger_count ?? 0);
        const stepCount = Number(w.step_count ?? 0);
        const executable = triggerCount > 0 && stepCount > 0;
        return {
          id: w.id,
          title: w.name,
          description: ((w.metadata as Record<string, unknown> | null)?.description as string) ?? null,
          type: 'general',
          category: w.category ?? 'system',
          status: executable ? (w.status ?? 'inactive') : 'incomplete',
          created_at: w.created_at,
          updated_at: w.last_run_at ?? w.updated_at ?? w.created_at,
          last_run_at: w.last_run_at ?? null,
          last_run_status: w.last_run_status ?? null,
          run_count: w.run_count ?? 0,
          workflow_key: w.workflow_key ?? null,
          trigger_count: triggerCount,
          step_count: stepCount,
        };
      });
    }

    if (aiResult.error) {
      console.error('[admin/workflows/unified] ai_tasks query failed', aiResult.error);
      warnings.push('AI task records are temporarily unavailable.');
    } else {
      aiTasks = (aiResult.data ?? []).map((t): UnifiedWorkflow => {
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
    }

    const workflows = [...generalWorkflows, ...aiTasks].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    return NextResponse.json({
      workflows,
      total: workflows.length,
      status: warnings.length ? 'degraded' : 'healthy',
      warnings,
    }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error('[admin/workflows/unified] loader initialization failed', error);
    return NextResponse.json({
      workflows: [],
      total: 0,
      status: 'unavailable',
      warnings: ['Workflow storage is temporarily unavailable.'],
    }, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}

export async function POST(request: NextRequest) {
  const auth = await authorize(request, 'strict');
  if (auth.error) return auth.error;

  try {
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
      if (error) {
        console.error('[admin/workflows/unified] AI task insert failed', error);
        return NextResponse.json({ error: 'Failed to create AI task' }, { status: 500 });
      }
      return NextResponse.json({ status: 'ok', type: 'ai_task' }, { status: 201 });
    }

    const { error } = await db.from('workflows').insert({
      name: title,
      category: body.category ?? 'system',
      status: 'inactive',
      metadata: {},
    });
    if (error) {
      console.error('[admin/workflows/unified] workflow insert failed', error);
      return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
    }
    return NextResponse.json({ status: 'ok', type: 'general' }, { status: 201 });
  } catch (error) {
    console.error('[admin/workflows/unified] create failed', error);
    return NextResponse.json({ error: 'Workflow storage is unavailable' }, { status: 503 });
  }
}
