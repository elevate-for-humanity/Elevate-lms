import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redirect',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-static';
export const revalidate = 3600;

import { redirect } from 'next/navigation';
export default function CDLPage() {
  redirect('/programs/cdl-training');
}
