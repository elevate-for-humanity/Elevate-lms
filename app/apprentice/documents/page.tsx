import { Metadata } from 'next';
import { Suspense } from 'react';
import DocumentsClient from './DocumentsClient';

export const metadata: Metadata = {
  title: 'Documents | Apprentice Portal | Elevate for Humanity',
  description: 'Upload and manage your required apprenticeship documents.',
};

export default function ApprenticeDocumentsPage() {
  return (
    <Suspense>
      <DocumentsClient />
    </Suspense>
  );
}
