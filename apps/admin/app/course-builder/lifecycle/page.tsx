import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Compatibility entry only. Course lifecycle governance is owned by Dev Studio.
 */
export default function LegacyCourseLifecyclePage() {
  redirect('/studio/courses/lifecycle');
}
