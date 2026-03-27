import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import UploadDocumentsClient from './UploadDocumentsClient';

export const metadata: Metadata = {
  title: 'Upload Documents | Supersonic Fast Cash',
  description: 'Securely upload your tax documents. W-2, 1099, photo ID, and more.',
};

export const dynamic = 'force-dynamic';

export default async function UploadDocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login?redirect=/supersonic-fast-cash/upload-documents');

  const admin = createAdminClient();

  const { data: consent } = await admin!
    .from('client_consents').select('id').eq('client_id', user.id).limit(1).maybeSingle();
  if (!consent) redirect('/supersonic-fast-cash/consent?next=/supersonic-fast-cash/upload-documents');

  const { data: payment } = await admin!
    .from('tax_payments').select('id').eq('client_id', user.id).eq('status', 'paid').limit(1).maybeSingle();
  if (!payment) redirect('/supersonic-fast-cash/payment');

  const { data: documents } = await admin!
    .from('tax_documents')
    .select('id, document_type, file_name, file_size, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <UploadDocumentsClient
      userEmail={user.email ?? ''}
      existingDocuments={documents ?? []}
    />
  );
}
