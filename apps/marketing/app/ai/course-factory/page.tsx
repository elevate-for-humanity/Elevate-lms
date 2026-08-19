import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Course Factory',
  alternates: { canonical: 'https://www.elevateforhumanity.org/course-factory' },
  robots: { index: false, follow: true },
};

/**
 * Compatibility route. Public Course Factory marketing has one canonical
 * surface at /course-factory; the Admin Studio remains the execution surface.
 */
export default function AiCourseFactoryCompatibilityPage() {
  permanentRedirect('/course-factory');
}
