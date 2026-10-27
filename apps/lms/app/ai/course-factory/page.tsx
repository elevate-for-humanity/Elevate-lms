import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Ultimate Course Builder',
  robots: { index: false, follow: false },
};

export default function ArchivedCourseFactoryPage() {
  redirect('https://admin.elevateforhumanity.org/studio/courses?tab=ultimate');
}
