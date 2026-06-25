import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Collaborate',
  alternates: { canonical: 'https://www.elevateforhumanity.org/creator/community/collaborate' },
};

export default function Page() { redirect('/community'); }
