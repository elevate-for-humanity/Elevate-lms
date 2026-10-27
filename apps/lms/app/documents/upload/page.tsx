import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Upload Documents',
  robots: { index: false, follow: false },
};

export default function DocumentsUploadPage() {
  redirect('/apprentice/documents');
}
