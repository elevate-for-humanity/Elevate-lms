import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { PLATFORM_ADMIN_ROLES } from '@/lib/rbac/role-matrix';
import { LMS_HOST } from '@/lib/routing/portal-map';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Host Shop Portal | Elevate',
  robots: { index: false, follow: false },
};

/**
 * Compatibility route only. Host Shop operations are owned by the LMS service.
 * Keep authorization on the old Admin URL, then forward administrators to the
 * canonical LMS portal where they explicitly choose the shop to preview.
 */
export default async function LegacyAdminHostShopDashboard() {
  await requireRole(PLATFORM_ADMIN_ROLES);
  redirect(`${LMS_HOST}/host-shop/dashboard`);
}
