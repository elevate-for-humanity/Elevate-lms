import { permanentRedirect } from 'next/navigation';

export const metadata = { robots: { index: false, follow: false } };

export default function LegacyAdminAlias() {
  permanentRedirect('/mission-control');
}
