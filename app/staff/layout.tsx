/**
 * Staff portal — role gate + no static cache (student PII must never be ISR-cached).
 */
import type { Metadata } from 'next';
import { requireStaffPortalAccess } from '@/lib/staff-portal/access';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function StaffPortalLayout({ children }: { children: React.ReactNode }) {
  await requireStaffPortalAccess();
  return <>{children}</>;
}
