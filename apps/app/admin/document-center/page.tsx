import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { DocumentCenterClient } from './DocumentCenterClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Document Center | Admin | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export default async function DocumentCenterPage() {
  await requireAdmin();
  const db = await createAdminClient();

  const { data, error } = await db
    .from('documents')
    .select('id, file_name, file_path, file_url, mime_type, file_size_bytes, document_type, status, created_at, uploaded_by')
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <DocumentCenterClient
      initialDocuments={data ?? []}
      fetchError={error ? error.message : null}
    />
  );
}
