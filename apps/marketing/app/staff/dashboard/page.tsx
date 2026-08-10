import { permanentRedirect } from 'next/navigation';
import { ADMIN_HOST } from '@/lib/routing/portal-map';

/**
 * Compatibility route only.
 * Staff operations are owned by the Admin application.
 */
export default function LegacyMarketingStaffDashboard() {
  permanentRedirect(`${ADMIN_HOST}/staff-portal/dashboard`);
}
