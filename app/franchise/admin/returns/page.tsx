import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redirect',
  robots: { index: false, follow: false },
};

import { redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export default function FranchiseReturnsPage() {
  redirect('/franchise');
}
