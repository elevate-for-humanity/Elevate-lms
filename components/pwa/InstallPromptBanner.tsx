'use client';

/**
 * Root-level PWA install prompt for authenticated/application surfaces.
 *
 * Do not mount the beforeinstallprompt interceptor on public marketing routes.
 * Calling preventDefault() globally suppresses the browser's native install UI
 * and causes "Banner not shown" console noise on pages such as /programs.
 *
 * Admin uses its own AdminInstallPrompt in apps/admin/app/admin/layout.tsx.
 */

import { usePathname } from 'next/navigation';
import { InstallPrompt } from './InstallPrompt';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const PWA_ROUTE_PREFIXES = [
  '/lms',
  '/student',
  '/apprentice',
  '/host-shop',
  '/program-holder',
  '/employer',
  '/partner',
  '/portal',
  '/dashboard',
  '/install-app',
];

export function InstallPromptBanner() {
  const pathname = usePathname();

  const isPwaSurface = PWA_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!isPwaSurface) return null;

  return (
    <InstallPrompt
      appName={PLATFORM_DEFAULTS.orgName}
      appDescription="Add to your home screen for fast access to your courses and programs."
      themeColor="#1E3A5F"
    />
  );
}

export default InstallPromptBanner;
