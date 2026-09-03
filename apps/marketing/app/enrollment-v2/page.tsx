import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Legacy enrollment-v2 hub.
 * The complete student intake is /apply/student; keeping a second public
 * enrollment funnel creates competing records and stale program/funding copy.
 */
export default function LegacyEnrollmentV2Hub() {
  redirect('/apply/student');
}
