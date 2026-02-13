import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Serene Comfort Care | Partner | Elevate for Humanity',
  description: 'Serene Comfort Care partners with Elevate for Humanity to provide healthcare career training and job placement opportunities.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners' },
};

export default function Page() { redirect('/platform/partners'); }
