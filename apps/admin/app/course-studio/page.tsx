import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Compatibility entry only. The master Course Builder owns every authoring
 * and learner-preview surface.
 */
export default function CourseStudioCompatibilityPage() {
  redirect('/studio/courses');
}
