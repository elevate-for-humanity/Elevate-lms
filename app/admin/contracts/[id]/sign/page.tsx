import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import SignatureClient from './SignatureClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Sign Contract | Admin' };

export default async function SignPage({
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

  if (!user) {
    redirect('/login');
  }


  const db = await requireAdminClient();
  const { data: profile } = await db.from('profiles').select('role, full_name, email').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) redirect('/unauthorized');

  const { data: contract } = await db
    .from('contract_templates')
    .select('id, title, agency_name')
    .eq('id', id)
    .maybeSingle();
  if (!contract) notFound();

  // Load run
  const runQuery = runId
    ? db.from('contract_prefill_runs').select('id, status, missing_values, approved_values').eq('id', runId).eq('contract_template_id', id).limit(1)
    : db.from('contract_prefill_runs').select('id, status, missing_values, approved_values').eq('contract_template_id', id).order('created_at', { ascending: false }).limit(1);

  const { data: runs } = await runQuery;
  const run = runs?.[0];
  if (!run) redirect(`/admin/contracts/${id}`);

  // Load existing signature if any
  const { data: existingSig } = await db
    .from('contract_signature_fields')
    .select('id, signer_name, signer_title, signed_at')
    .eq('contract_template_id', id)
    .eq('prefill_run_id', run.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const missingCount = Object.keys(run.missing_values ?? {}).length;

  return (
    <SignatureClient
      contractId={id}
      contractTitle={contract.title}
      agencyName={contract.agency_name}
      runId={run.id}
      runStatus={run.status}
      missingCount={missingCount}
      existingSignature={existingSig ?? null}
      defaultSignerName={profile.full_name ?? ''}
      defaultSignerEmail={profile.email ?? ''}
    />
  );
}
