import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Forums',
  alternates: { canonical: 'https://www.elevateforhumanity.org/creator/community/forums' },
};

export default function Page() { redirect('/community'); }
