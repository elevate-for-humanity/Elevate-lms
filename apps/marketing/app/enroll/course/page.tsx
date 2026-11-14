import { permanentRedirect } from 'next/navigation';

/**
 * Retired malformed generic enrollment URL.
 * Enrollment requires a real program identifier, so send generic/legacy
 * traffic to the canonical public program catalog instead of letting the
 * dynamic /enroll/[programId] route treat "course" as a program slug.
 */
export default function RetiredGenericCourseEnrollmentPage() {
  permanentRedirect('/programs');
}
