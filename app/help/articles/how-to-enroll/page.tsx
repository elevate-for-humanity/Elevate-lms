import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'How To Enroll',
  alternates: { canonical: 'https://www.elevateforhumanity.org/help/articles/how-to-enroll' },
};

export default function Page() { redirect('/faq'); }
