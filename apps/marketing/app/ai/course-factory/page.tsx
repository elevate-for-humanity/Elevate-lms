import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdminUrl } from '@/lib/config/admin-url';

export const metadata: Metadata = {
  title: 'Ultimate Course Builder',
  robots: { index: false, follow: false },
};

export default function ArchivedCourseFactoryPage() {
  redirect(getAdminUrl('/studio/courses?tab=ultimate'));
}
