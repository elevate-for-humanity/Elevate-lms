import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'Privacy Policy',
  robots: { index: false, follow: true },
};

export default function PrivacyPolicyAliasPage() {
  permanentRedirect('/privacy');
}
