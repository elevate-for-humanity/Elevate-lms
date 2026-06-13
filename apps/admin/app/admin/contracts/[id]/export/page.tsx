import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import ExportClient from './ExportClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Export Contract | Admin' };

export default async function ExportPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ run?: string }>;
}) {
  const { id } = await params;
  const { run: runId } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const db = await requireAdminClient();
  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) redirect('/unauthorized');

  const { data: contract } = await db
    .from('contract_templates')
    .select('id, title, agency_name, file_type')
    .eq('id', id)
    .maybeSingle();
  if (!contract) notFound();

  const runQuery = runId
    ? db.from('contract_prefill_runs').select('id, status, approved_values').eq('id', runId).eq('contract_template_id', id).limit(1)
    : db.from('contract_prefill_runs').select('id, status, approved_values').eq('contract_template_id', id).order('created_at', { ascending: false }).limit(1);

  const { data: runs } = await runQuery;
  const run = runs?.[0];
  if (!run) redirect(`/admin/contracts/${id}`);

  // Load previous exports
  const { data: exports } = await db
    .from('contract_exports')
    .select('id, export_type, status, file_size, created_at')
    .eq('contract_template_id', id)
    .eq('prefill_run_id', run.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const approvedCount = Object.keys(run.approved_values ?? {}).length;

  return (
    <ExportClient
      contractId={id}
      contractTitle={contract.title}
      agencyName={contract.agency_name}
      runId={run.id}
      runStatus={run.status}
      approvedCount={approvedCount}
      previousExports={exports ?? []}
      isPdf={contract.file_type?.includes('pdf') ?? true}
    />
  );
}
