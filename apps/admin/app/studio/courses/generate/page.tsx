import { redirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

// Consolidated into /admin/courses/pipeline
export default function Page() {
  redirect('/admin/courses/pipeline');
}
