import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Elevate for Humanity Privacy Policy',
  robots: { index: false, follow: true },
};

export default function LegacyPrivacyRedirect() {
  permanentRedirect('/privacy');
}
