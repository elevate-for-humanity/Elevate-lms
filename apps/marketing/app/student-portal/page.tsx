import { redirect } from 'next/navigation';

/**
 * Compatibility entry for older emails, bookmarks, and support links.
 * The public explanation remains canonical at /platform/student-portal.
 */
export default function StudentPortalCompatibilityPage() {
  redirect('/platform/student-portal');
}
