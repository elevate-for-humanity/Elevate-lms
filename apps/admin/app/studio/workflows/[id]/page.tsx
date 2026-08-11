import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/authGuards';
import { requireAdminClient } from '@/lib/supabase/admin';
import WorkflowDetailClient from './WorkflowDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: `Workflow ${id.slice(0, 8)} | Dev Studio` };
}

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const db = await requireAdminClient();

  const [{ data: workflow }, { data: triggers }, { data: steps }, { data: runs }] =
    await Promise.all([
      db.from('workflows').select('*').eq('id', id).single(),
      db.from('workflow_triggers').select('*').eq('workflow_id', id).order('created_at'),
      db.from('workflow_steps').select('*').eq('workflow_id', id).order('step_order'),
      db
        .from('workflow_runs')
        .select('*')
        .eq('workflow_id', id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

  if (!workflow) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-50">
      <WorkflowDetailClient
        workflow={workflow}
        triggers={triggers ?? []}
        steps={steps ?? []}
        runs={runs ?? []}
      />
    </div>
  );
}
