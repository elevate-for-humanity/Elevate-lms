'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  isAppRoute,
  isAdminRoute,
  shouldHideMarketingHeader,
} from '@/lib/layout/app-routes';

// Route list lives in lib/layout/app-routes.ts — single source of truth.
// Do not duplicate the prefix list here or in app/layout.tsx.

export default function MarketingChromeGuard() {
  const pathname = usePathname();

  useEffect(() => {
    const app = isAppRoute(pathname);
    const customHeader = shouldHideMarketingHeader(pathname);
    const admin = isAdminRoute(pathname);

    // Toggle on <body> — keyed by the inline script in root layout for hard navs,
    // and by this effect for client-side SPA transitions.
    if (app) {
      document.body.setAttribute('data-app-route', 'true');
      document.body.removeAttribute('data-custom-header-route');
    } else if (customHeader) {
      document.body.removeAttribute('data-app-route');
      document.body.setAttribute('data-custom-header-route', 'true');
    } else {
      document.body.removeAttribute('data-app-route');
      document.body.removeAttribute('data-custom-header-route');
    }

    // Admin routes get an additional attribute so the footer can be
    // re-shown via CSS while the header stays hidden.
    if (admin) {
      document.body.setAttribute('data-admin-route', 'true');
    } else {
      document.body.removeAttribute('data-admin-route');
    }

    // Also toggle the legacy data-public-layout-root attribute for any code
    // that still reads it directly.
    const root = document.querySelector('[data-public-layout-root]');
    if (root) {
      if (app) {
        root.setAttribute('data-app-route', 'true');
        root.removeAttribute('data-custom-header-route');
      } else if (customHeader) {
        root.removeAttribute('data-app-route');
        root.setAttribute('data-custom-header-route', 'true');
      } else {
        root.removeAttribute('data-app-route');
        root.removeAttribute('data-custom-header-route');
      }
      if (admin) {
        root.setAttribute('data-admin-route', 'true');
      } else {
        root.removeAttribute('data-admin-route');
      }
    }

  }, [pathname]);

  return null;
}
