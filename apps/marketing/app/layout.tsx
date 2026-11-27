import { DashboardReadingSupport } from '@/components/accessibility/DashboardReadingSupport';
/**
 * Production release marker: PARIS mobile controls, 2026-09-10.
 * IMPORTANT: client-polyfills MUST be the first import in this file.
 */
import './client-polyfills';

import type { Metadata } from 'next';
import { Suspense } from 'react';
import '@marketing-css/core.css';
import '@marketing-css/part-1.css';
import '@marketing-css/part-2.css';
import '@marketing-css/part-3.css';
import './layout.css';
import '../../../styles/contrast-guardrails.css';
import '../../../styles/responsive-guardrails.css';
import { MarketingChromeBoundary } from '@/components/site/MarketingChromeBoundary';
import Header from '@/components/site/Header';
import { SiteFooter } from '@/components/site-footer';
import StoreFooter from '@/components/store/StoreFooter';
import { getPublicRuntimeService } from '@/lib/health/public-runtime-service';
import { PublicParisLauncher } from './PublicParisLauncher';
import { I18nProvider } from '@/lib/i18n/context';
import { chunkRecoveryBootstrap } from '@/lib/browser/chunk-recovery-bootstrap';
import { MarketingPwaClient } from '@/components/pwa/MarketingPwaClient';
import { SupabasePublicConfigScript } from '@/components/supabase/SupabasePublicConfigScript';
import { SupabaseConfigBootstrap } from '@/components/supabase/SupabaseConfigBootstrap';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { FirstPartyTraffic } from '@/components/analytics/FirstPartyTraffic';
import { SkipToContent } from '@/components/accessibility/SkipToContent';
import { AssociateFormLabels } from '@/components/accessibility/AssociateFormLabels';
import SpeechCanceller from '@/components/ui/SpeechCanceller';
import CookieConsent from '@/components/CookieConsent';
import FacebookPixel from '@/components/FacebookPixel';
import { ScrollNarrator } from '@/components/home/ScrollNarrator';
import { MediaPlaybackCoordinator } from '@/components/media/MediaPlaybackCoordinator';
import {
  MARKETING_SITE_URL,
  organizationJsonLd,
} from '@/lib/seo/marketing-organization-schema';

const siteUrl = MARKETING_SITE_URL;
const shareImageUrl = `${siteUrl}/images/partners/salon-saloon/team-sign.webp`;

export const metadata: Metadata = {
  title: {
    default: 'Elevate for Humanity | Career Training & Registered Apprenticeships',
    template: '%s | Elevate for Humanity',
  },
  description:
    'Explore career training, registered apprenticeships, employer-connected learning, workforce funding pathways, testing, and credentials through Elevate for Humanity in Indiana.',
  applicationName: 'Elevate for Humanity',
  metadataBase: new URL(siteUrl),
  manifest: '/manifest-marketing.json',
  keywords: [
    'career training Indianapolis',
    'registered apprenticeship Indiana',
    'workforce training Indiana',
    'barber apprenticeship',
    'beauty apprenticeship',
    'HVAC training',
    'CDL training',
    'business training',
    'ETPL training provider',
    'workforce funding',
    'employer training partnerships',
  ],
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png', sizes: '192x192' }],
    shortcut: [{ url: '/favicon.png', type: 'image/png', sizes: '192x192' }],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website',
    siteName: 'Elevate for Humanity',
    title: 'Elevate for Humanity | Career Training & Registered Apprenticeships',
    description:
      'Find a career path, understand your training and funding options, and connect with apprenticeship and employer opportunities in one place.',
    images: [{ url: shareImageUrl, alt: 'Elevate for Humanity career training' }],
  },
  twitter: { card: 'summary_large_image', images: [shareImageUrl] },
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

// Public pages can prerender or revalidate. Authenticated route layouts and
// request-dependent pages retain their own dynamic rendering boundaries.

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const storeOnly = getPublicRuntimeService() === 'store';
  return (
    <html lang="en">
      <head>
        <script id="marketing-chunk-recovery" dangerouslySetInnerHTML={{ __html: chunkRecoveryBootstrap() }} />
        <SupabasePublicConfigScript />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className="efh-contrast">
        <SkipToContent />
        <SupabaseConfigBootstrap />
        <MarketingPwaClient />
        <GoogleAnalytics />
        <Suspense fallback={null}><FacebookPixel /></Suspense>
        <Suspense fallback={null}><FirstPartyTraffic /></Suspense>
        <AssociateFormLabels />
        <Suspense fallback={null}><SpeechCanceller /></Suspense>
        <I18nProvider>
          <Suspense fallback={<div id="main-content" role="status" className="min-h-dvh p-6">Loading page…</div>}>
          <MarketingChromeBoundary
            storeOnly={storeOnly}
            header={<Header />}
            footer={storeOnly ? <StoreFooter /> : <SiteFooter />}
            paris={<PublicParisLauncher />}
          >
            <DashboardReadingSupport dashboardOnly>{children}</DashboardReadingSupport>
          </MarketingChromeBoundary>
        </Suspense>
        </I18nProvider>
        <MediaPlaybackCoordinator />
        <Suspense fallback={null}><ScrollNarrator /></Suspense>
        <CookieConsent />
      </body>
    </html>
  );
}
