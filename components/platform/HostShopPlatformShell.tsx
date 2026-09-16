'use client';

import type { ComponentProps } from 'react';
import { I18nProvider } from '@/lib/i18n/context';
import { PlatformShell } from '@/components/platform/PlatformShell';

/**
 * Host Shop dashboards provide a visible language control for owners and staff.
 * The locale cookie is shared across the site and persists for one year.
 */
export function HostShopPlatformShell(
  props: Omit<ComponentProps<typeof PlatformShell>, 'role' | 'showLanguageSwitcher'>,
) {
  return (
    <I18nProvider>
      <PlatformShell {...props} role="host_shop" showLanguageSwitcher />
    </I18nProvider>
  );
}
