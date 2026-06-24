import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: { template: '%s | Hub', default: 'Hub | {PLATFORM_DEFAULTS.orgName}' },
  description: '{PLATFORM_DEFAULTS.orgName} learning hub.',
  robots: { index: false, follow: false },
};

export default function HubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
