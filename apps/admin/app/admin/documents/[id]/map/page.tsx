import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import FieldMapClient from './FieldMapClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Field Mapping | Admin | Elevate For Humanity',
};

export default async function DocumentMapPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();


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

  const { data: doc } = await db
    .from('documents')
    .select(
      'id, title, file_name, document_type, file_url, url, extraction_status, extracted_data, ocr_text, created_at',
    )
    .eq('id', id)
    .maybeSingle();

  if (!doc) notFound();

  const { data: mappings } = await db
    .from('document_field_mappings')
    .select('*')
    .eq('document_id', id)
    .order('created_at', { ascending: true });

  // Load org facts for prefill suggestions
  const { data: orgFacts } = await db
    .from('sos_organization_facts')
    .select('fact_key, fact_value_json, status, approved_at')
    .eq('status', 'approved')
    .order('fact_key');

  // Load org profile
  const { data: org } = await db
    .from('sos_organizations')
    .select(
      'id, legal_name, dba_name, ein, uei, sam_status, phone, general_email, address_line_1, address_line_2, city, state, zip, authorized_signatory_name, authorized_signatory_title',
    )
    .limit(1)
    .maybeSingle();

  return (
    <FieldMapClient
      doc={doc}
      mappings={mappings ?? []}
      orgFacts={orgFacts ?? []}
      org={org}
    />
  );
}
