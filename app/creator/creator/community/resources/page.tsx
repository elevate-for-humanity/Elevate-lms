import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Resources',
  alternates: { canonical: 'https://www.elevateforhumanity.org/creator/community/resources' },
};

export default function Page() { redirect('/community'); }
