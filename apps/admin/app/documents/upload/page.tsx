import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { DocumentUploadClient } from './DocumentUploadClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://admin.elevateforhumanity.org/documents/upload' },
  title: 'Upload Documents | Elevate For Humanity',
  description: 'Upload documents and files to the document center.',
};

export default async function UploadDocumentsPage({ searchParams }: {searchParams: Promise<{user_id?: string}>}) {
  await requireRole(['admin']);
  const {user_id} = await searchParams;
  return <DocumentUploadClient ownerId={user_id} />;
}
