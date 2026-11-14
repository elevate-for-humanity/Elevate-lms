import { permanentRedirect } from 'next/navigation';

export const metadata = {
  title: 'Verify Credentials',
  description: 'Verify an Elevate credential through the learner platform.',
  robots: { index: false, follow: true },
};

export default function LegacyMarketingCredentialVerificationPage() {
  permanentRedirect('https://app.elevateforhumanity.org/verify-credentials');
}
