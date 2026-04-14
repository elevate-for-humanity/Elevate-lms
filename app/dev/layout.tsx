import type { Metadata } from 'next';
import { requireAuth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// /dev/* routes are internal development tools — never index them.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

// Require authentication for all /dev/* routes.
// These pages serve internal video previews and slide tools.
// No role restriction beyond authentication — any logged-in user can access.
export default async function DevLayout({ children }: { children: React.ReactNode }) {
  await requireAuth('/dev');
  return <>{children}</>;
}
