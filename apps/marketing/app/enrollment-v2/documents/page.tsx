import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * The legacy enrollment-v2 document screen rendered upload controls without a
 * working upload action and depended on the retired v2 application record.
 * Applicants now return to the canonical intake/portal workflow.
 */
export default function LegacyEnrollmentV2DocumentsPage() {
  redirect('/apply/student');
}
