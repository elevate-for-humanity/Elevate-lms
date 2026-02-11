import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner With Us | Elevate for Humanity',
  description: 'Partner with Elevate for Humanity to expand workforce development in your community. Employer, education, and government partnership opportunities.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/partners' },
};

export default function Page() { redirect('/platform/partners'); }
