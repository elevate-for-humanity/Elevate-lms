import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false },
  title: 'Security & Data Protection',
  description: 'Security and data protection policies for Elevate for Humanity.',
};

export default function SecurityDataProtectionPage() {
  redirect('/legal/security');
}
