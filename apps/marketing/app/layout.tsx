/**
 * IMPORTANT: client-polyfills MUST be the first import in this file.
 * It patches the browser environment (Buffer, process, etc.) before
 * any other module — including Next.js internals — runs.
 * Placing it anywhere else risks a "Buffer is not defined" crash.
 */
import './client-polyfills';

import type { Metadata } from 'next';
import './globals.css';
import './layout.css';
import Header from '@/components/site/Header';
import { SiteFooter } from '@/components/site-footer';
import { I18nProvider } from '@/lib/i18n/context';
import { ChunkRecovery } from '@/components/system/ChunkRecovery';
import { MarketingPwaClient } from '@/components/pwa/MarketingPwaClient';
import { SupabasePublicConfigScript } from '@/components/supabase/SupabasePublicConfigScript';
import { SupabaseConfigBootstrap } from '@/components/supabase/SupabaseConfigBootstrap';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';

export const metadata: Metadata = {
  title: { default: 'Elevate for Humanity', template: '%s | Elevate for Humanity' },
  description: 'Vocational education and workforce development',
  metadataBase: new URL('https://www.elevateforhumanity.org'),
  manifest: '/manifest-marketing.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

// Keep current rendering semantics until the route-by-route cache audit proves
// which public pages are safe to move to static/ISR rendering.
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <SupabasePublicConfigScript />
      </head>
      <body>
        <SupabaseConfigBootstrap />
        <MarketingPwaClient />
        <ChunkRecovery />
        <GoogleAnalytics />
        <I18nProvider>
          <Header />
          <main className="site-main pt-[60px]">{children}</main>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
