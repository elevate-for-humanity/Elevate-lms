export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Upload Documents | Supersonic Fast Cash',
  description: 'Upload your tax documents securely. Login required to protect your sensitive information.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/upload-documents',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function UploadDocumentsLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  
  if (!supabase) {
    redirect('/login?redirect=/supersonic-fast-cash/upload-documents&reason=secure');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/supersonic-fast-cash/upload-documents&reason=secure');
  }

  return <>{children}</>;
}
