import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import DocumentDetailClient from './DocumentDetailClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Document | Admin | Elevate For Humanity',
};

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const db = await requireAdminClient();

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  const { data: doc } = await db
    .from('documents')
    .select('id, title, file_name, document_type, mime_type, file_size, file_size_bytes, file_path, file_url, url, status, extraction_status, extracted_data, ocr_text, ocr_confidence, processed_at, created_at')
    .eq('id', id)
    .maybeSingle();

  if (!doc) notFound();

  // Fetch existing field mappings
  const { data: mappings } = await db
    .from('document_field_mappings')
    .select('*')
    .eq('document_id', id)
    .order('created_at', { ascending: true });

  return (
    <DocumentDetailClient
      doc={doc}
      mappings={mappings ?? []}
    />
  );
}
