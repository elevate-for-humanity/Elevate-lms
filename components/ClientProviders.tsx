'use client';

import * as React from 'react';
import { I18nProvider } from '@/lib/i18n/context';
import { OfflineIndicator } from '@/components/pwa/OfflineIndicator';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nProvider>
      {children}
      <OfflineIndicator />
    </I18nProvider>
  );
}
