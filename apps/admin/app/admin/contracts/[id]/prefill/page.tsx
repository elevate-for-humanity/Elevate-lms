import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import PrefillReviewClient from './PrefillReviewClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Review Fields | Contract | Admin' };

export default async function PrefillReviewPage({
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


  // Guard against null user
  if (!user) redirect('/login');
  const db = await requireAdminClient();

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'staff'].includes(profile.role)) redirect('/unauthorized');

  const { data: contract } = await db
    .from('contract_templates')
    .select('id, title, agency_name, source_type, original_file_path, file_type')
    .eq('id', id)
    .maybeSingle();
  if (!contract) notFound();

  // Load run — use provided runId or latest
  let runQuery = db
    .from('contract_prefill_runs')
    .select('id, status, response_style, matched_values, missing_values, approved_values, field_metadata, created_at')
    .eq('contract_template_id', id)
    .order('created_at', { ascending: false })
    .limit(1);

  if (runId) {
    runQuery = db
      .from('contract_prefill_runs')
      .select('id, status, response_style, matched_values, missing_values, approved_values, field_metadata, created_at')
      .eq('id', runId)
      .eq('contract_template_id', id)
      .limit(1);
  }

  const { data: runs } = await runQuery;
  const run = runs?.[0];
  if (!run) redirect(`/admin/contracts/${id}`);

  // Load fields for ordering
  const { data: fields } = await db
    .from('contract_template_fields')
    .select('field_key, label, field_type, required, sort_order')
    .eq('contract_template_id', id)
    .order('sort_order');

  // Signed preview URL
  let previewUrl: string | null = null;
  try {
    const { createClient: sc } = await import('@supabase/supabase-js');
    const sUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (sUrl && sKey && contract.original_file_path) {
      const storage = sc(sUrl, sKey, { auth: { persistSession: false } });
      const { data: signed } = await storage.storage.from('contracts').createSignedUrl(contract.original_file_path, 3600);
      previewUrl = signed?.signedUrl ?? null;
    }
  } catch { /* non-fatal */ }

  return (
    <PrefillReviewClient
      contractId={id}
      contractTitle={contract.title}
      run={run}
      fields={fields ?? []}
      previewUrl={previewUrl}
      isPdf={contract.file_type?.includes('pdf') ?? false}
    />
  );
}
