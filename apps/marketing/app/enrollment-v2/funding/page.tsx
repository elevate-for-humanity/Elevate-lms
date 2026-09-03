import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Legacy v2 funding page contained hard-coded approval timelines, BNPL amounts,
 * and provider claims. The canonical funding page is the maintained source.
 */
export default function LegacyEnrollmentV2FundingPage() {
  redirect('/funding');
}
