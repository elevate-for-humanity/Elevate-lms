import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import ContractDetailClient from './ContractDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Contract | Admin | Elevate For Humanity',
};

export default async function ContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }


  const db = await requireAdminClient();

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !['admin', 'staff'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  const { data: contract } = await db
    .from('contract_templates')
    .select(`
      id, title, agency_name, source_type, file_name, file_type,
      file_size, status, extraction_method, original_file_path, page_count, notes,
      created_at, updated_at,
      contract_template_fields (
        id, label, field_key, field_type, required,
        context_snippet, confidence, sort_order
      ),
      contract_prefill_runs (
        id, status, response_style, created_at,
        matched_values, missing_values, approved_values, field_metadata
      )
    `)
    .eq('id', id)
    .order('sort_order', { referencedTable: 'contract_template_fields', ascending: true })
    .order('created_at', { referencedTable: 'contract_prefill_runs', ascending: false })
    .maybeSingle();

  if (!contract) notFound();

  // Get signed URL for preview (private bucket — 1 hour)
  let previewUrl: string | null = null;
  try {
    // Use admin client directly for contract storage
    if (contract?.original_file_path) {
      const { data: signed } = await db.storage
        .from('contracts')
        .createSignedUrl(contract.original_file_path, 3600);
      previewUrl = signed?.signedUrl ?? null;
    }
  } catch { /* non-fatal */ }

  return (
    <ContractDetailClient
      contract={contract}
      previewUrl={previewUrl}
    />
  );
}
