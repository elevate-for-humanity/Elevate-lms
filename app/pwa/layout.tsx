import type { Metadata, Viewport } from 'next';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Elevate Apps',
  description: 'Mobile apps for {PLATFORM_DEFAULTS.orgName} programs',
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function PWALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
