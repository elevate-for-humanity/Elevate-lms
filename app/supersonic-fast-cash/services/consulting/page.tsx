import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Consulting',
  alternates: { canonical: 'https://www.elevateforhumanity.org/supersonic-fast-cash/services/consulting' },
};

export default function Page() { redirect('/platform/partners'); }
