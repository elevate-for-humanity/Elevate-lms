import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Certificates',
  alternates: { canonical: 'https://www.elevateforhumanity.org/help/articles/certificates' },
};

export default function Page() { redirect('/faq'); }
