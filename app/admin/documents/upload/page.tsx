import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { DocumentUploadClient } from './DocumentUploadClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/documents/upload' },
  title: 'Upload Documents | Elevate For Humanity',
  description: 'Upload documents and files to the document center.',
};

export default async function UploadDocumentsPage() {
  await requireRole(['admin', 'super_admin']);
  return <DocumentUploadClient />;
}
