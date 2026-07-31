import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// Unified workflow type
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
  // AI task fields
  prompt?: string | null;
  agent_name?: string | null;
  // General workflow fields
  workflow_key?: string | null;
  trigger_count?: number;
  step_count?: number;
}

export async function GET() {
  const db = await requireAdminClient();

  const [generalWorkflows, aiTasks] = await Promise.all([
    // General workflows
    db
      .from('workflows')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((w): UnifiedWorkflow => ({
          id: w.id,
          title: w.name,
          description: (w.metadata as any)?.description ?? null,
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
    // AI tasks
    db
      .from('ai_tasks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((t): UnifiedWorkflow => ({
          id: t.id,
          title: t.title ?? 'Untitled Task',
          description: (t.config as any)?.prompt ?? null,
          type: 'ai_task',
          category: 'ai',
          status: t.status ?? 'pending',
          created_at: t.created_at,
          updated_at: t.updated_at ?? t.created_at,
          last_run_at: t.updated_at ?? null,
          last_run_status: t.status ?? null,
          run_count: 1,
          prompt: (t.config as any)?.prompt ?? null,
          agent_name: (t.config as any)?.agent_name ?? null,
        }));
      }),
  ]);

  const unified = [...generalWorkflows, ...aiTasks].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return NextResponse.json({ workflows: unified, total: unified.length });
}

export async function POST(request: Request) {
  const db = await requireAdminClient();
  const body = await request.json();
  const { type, title, name, category, prompt, agent_name } = body;

  if (type === 'ai_task') {
    const { error } = await db.from('ai_tasks').insert({
      title: title ?? name,
      status: 'pending',
      config: { prompt, agent_name },
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ status: 'ok', type: 'ai_task' });
  }

  if (type === 'general') {
    const { error } = await db.from('workflows').insert({
      name: name ?? title,
      category: category ?? 'system',
      status: 'inactive',
      metadata: {},
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ status: 'ok', type: 'general' });
  }

  return NextResponse.json({ error: 'Invalid workflow type' }, { status: 400 });
}
