import { permanentRedirect } from 'next/navigation';

/**
 * Preserve the published student-resource URL while routing visitors to the
 * canonical program catalog. Navigation and historical external links still
 * reference /for-students, so this compatibility boundary must not 404.
 */
export default function ForStudentsPage() {
  permanentRedirect('/programs');
}
