import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Compatibility entry only. A course-specific studio requires a course id and
 * lives at /studio/courses/[courseId]; the bare entry opens the course picker.
 */
export default function CourseStudioCompatibilityPage() {
  redirect('/studio/courses');
}
