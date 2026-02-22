import { redirect } from 'next/navigation';

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partner | Elevate for Humanity',
  description: 'Elevate for Humanity - Career training and workforce development programs.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/partner',
  },
  robots: {
    index: false,
    follow: false,
  },
};
export default function PartnerPage() {
  redirect('/partner-portal');
}
