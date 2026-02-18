import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using Elevate for Humanity services.',
};


export default function TermsRedirect() {
  redirect('/terms-of-service');
}
