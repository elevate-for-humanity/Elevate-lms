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


  // Guard against null user
  if (!user) redirect('/login');
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
      file_size, status, extraction_method, page_count, notes,
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
    const { createClient: createStorageClient } = await import('@supabase/supabase-js');
    const storageUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const storageKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (storageUrl && storageKey) {
      const storage = createStorageClient(storageUrl, storageKey, { auth: { persistSession: false } });
      const { data: fileData } = await db
        .from('contract_templates')
        .select('original_file_path')
        .eq('id', id)
        .maybeSingle();
      if (fileData?.original_file_path) {
        const { data: signed } = await storage.storage
          .from('contracts')
          .createSignedUrl(fileData.original_file_path, 3600);
        previewUrl = signed?.signedUrl ?? null;
      }
    }
  } catch { /* non-fatal */ }

  return (
    <ContractDetailClient
      contract={contract}
      previewUrl={previewUrl}
    />
  );
}
