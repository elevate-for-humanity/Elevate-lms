import { permanentRedirect } from 'next/navigation';
import { MARKETING_HOST } from '@/lib/routing/portal-map';

/**
 * Compatibility route only.
 * The canonical cross-role portal directory is the public /portals hub.
 */
export default function LegacyDashboardsDirectory() {
  permanentRedirect(`${MARKETING_HOST}/portals`);
}
