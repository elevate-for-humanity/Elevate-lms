import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Events',
  alternates: { canonical: 'https://www.elevateforhumanity.org/creator/community/events' },
};

export default function Page() { redirect('/community'); }
