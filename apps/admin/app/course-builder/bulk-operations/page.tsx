import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Compatibility entry only. Bulk course operations are owned by Dev Studio.
 */
export default function LegacyBulkCourseOperationsPage() {
  redirect('/studio/courses/bulk-operations');
}
