import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Compatibility entry only. Dev Studio owns bulk course operations. */
export default function LegacyBulkCourseOperationsPage() {
  redirect('/studio/courses/bulk-operations');
}
