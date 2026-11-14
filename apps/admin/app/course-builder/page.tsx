import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Compatibility entry only. The canonical operational Course Builder lives
 * inside the Admin-owned Dev Studio at /studio/courses.
 */
export default function CourseBuilderCompatibilityPage() {
  redirect('/studio/courses');
}
