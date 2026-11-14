import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function LegacyCaseManagerCandidates() {
  permanentRedirect('https://app.elevateforhumanity.org/employer/candidates');
}
