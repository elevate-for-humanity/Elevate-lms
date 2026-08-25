import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * Compatibility entry for older emails, bookmarks, and support links.
 * The public explanation remains canonical at /platform/student-portal.
 */
export default function StudentPortalCompatibilityPage() {
  redirect('/platform/student-portal');
}
