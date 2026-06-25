import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: { template: '%s | Community', default: 'Community | {PLATFORM_DEFAULTS.orgName}' },
  description: '{PLATFORM_DEFAULTS.orgName} community hub.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
