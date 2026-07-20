import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Security & Data Protection | Elevate for Humanity',
  description: 'Security and data protection policies for Elevate for Humanity.',
};

export default function SecurityDataProtectionPage() {
  redirect('/legal/security');
}
