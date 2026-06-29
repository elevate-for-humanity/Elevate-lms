import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Orders',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/orders' },
};

export default function Page() { redirect('/store'); }
