import { Metadata } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: {
    template: '%s | Elevate Apps',
    default: 'Apps | {PLATFORM_DEFAULTS.orgName}',
  },
  description: 'Access your purchased apps and tools from {PLATFORM_DEFAULTS.orgName}.',
  robots: { index: false, follow: false },
};

export default function AppsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
