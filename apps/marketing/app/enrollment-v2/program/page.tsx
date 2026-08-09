import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Legacy hard-coded enrollment catalog.
 * Program discovery now comes from the canonical program catalog and pages.
 */
export default function LegacyEnrollmentV2ProgramPage() {
  redirect('/programs');
}
