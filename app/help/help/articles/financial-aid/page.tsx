import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Financial Aid',
  alternates: { canonical: 'https://www.elevateforhumanity.org/help/articles/financial-aid' },
};

export default function Page() { redirect('/faq'); }
