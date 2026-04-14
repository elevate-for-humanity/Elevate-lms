import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// All /course-preview/* routes are internal tools — never index them.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Server-side auth gate for the entire /course-preview subtree.
// These pages read curriculum data from Supabase — they must not be
// accessible to unauthenticated users. Client-only redirects are not
// sufficient because the DB query fires before the redirect resolves.
export default async function CoursePreviewLayout({ children }: { children: React.ReactNode }) {
  await requireAuth('/course-preview');
  return <>{children}</>;
}
