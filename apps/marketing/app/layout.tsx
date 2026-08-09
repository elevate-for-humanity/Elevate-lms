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
import '../../../styles/contrast-guardrails.css';
import Header from '@/components/site/Header';
import { SiteFooter } from '@/components/site-footer';
import { I18nProvider } from '@/lib/i18n/context';
import { ChunkRecovery } from '@/components/system/ChunkRecovery';
import { MarketingPwaClient } from '@/components/pwa/MarketingPwaClient';
import { SupabasePublicConfigScript } from '@/components/supabase/SupabasePublicConfigScript';
import { SupabaseConfigBootstrap } from '@/components/supabase/SupabaseConfigBootstrap';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { SkipToContent } from '@/components/accessibility/SkipToContent';
import { AssociateFormLabels } from '@/components/accessibility/AssociateFormLabels';

export const metadata: Metadata = {
  title: { default: 'Elevate for Humanity', template: '%s | Elevate for Humanity' },
  description: 'Vocational education and workforce development',
  applicationName: 'Elevate for Humanity',
  metadataBase: new URL('https://www.elevateforhumanity.org'),
  manifest: '/manifest-marketing.json',
  icons: {
    icon: [
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
      { url: '/favicon.ico', type: 'image/x-icon', sizes: '32x32' },
    ],
    shortcut: [{ url: '/icon-192.png', type: 'image/png', sizes: '192x192' }],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
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
      <body className="efh-contrast">
        <SupabaseConfigBootstrap />
        <MarketingPwaClient />
        <ChunkRecovery />
        <GoogleAnalytics />
        <AssociateFormLabels />
        <I18nProvider>
          <SkipToContent />
          <Header />
          <main id="main-content" tabIndex={-1} className="site-main pt-[68px] focus:outline-none">
            {children}
          </main>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
