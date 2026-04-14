import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Server-side auth gate for /preview/course/* routes.
// These pages query training_courses and training_lessons from Supabase.
// The client-side getUser() redirect in the page component is not sufficient
// because the DB query fires on mount before the redirect resolves.
export default async function PreviewCourseLayout({ children }: { children: React.ReactNode }) {
  await requireAuth('/preview/course');
  return <>{children}</>;
}
