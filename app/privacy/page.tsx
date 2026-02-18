import { redirect } from 'next/navigation';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'How Elevate for Humanity collects, uses, and protects your information.',
};


export default function PrivacyRedirect() {
  redirect('/privacy-policy');
}
