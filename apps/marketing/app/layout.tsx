/**
 * Production recovery deploy marker: 2026-08-13.
 * IMPORTANT: client-polyfills MUST be the first import in this file.
 */
import './client-polyfills';

import type { Metadata } from 'next';
import './globals.css';
import './layout.css';
import '../../../styles/contrast-guardrails.css';
import { MarketingChromeBoundary } from '@/components/site/MarketingChromeBoundary';
import { I18nProvider } from '@/lib/i18n/context';
import { ChunkRecovery } from '@/components/system/ChunkRecovery';
import { MarketingPwaClient } from '@/components/pwa/MarketingPwaClient';
import { SupabasePublicConfigScript } from '@/components/supabase/SupabasePublicConfigScript';
import { SupabaseConfigBootstrap } from '@/components/supabase/SupabaseConfigBootstrap';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { FirstPartyTraffic } from '@/components/analytics/FirstPartyTraffic';
import { SkipToContent } from '@/components/accessibility/SkipToContent';
import { AssociateFormLabels } from '@/components/accessibility/AssociateFormLabels';
import CookieConsent from '@/components/CookieConsent';

const siteUrl = 'https://www.elevateforhumanity.org';
const logoUrl = `${siteUrl}/images/logo.png`;

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
    'career training Indianapolis', 'registered apprenticeship Indiana', 'workforce training Indiana',
    'barber apprenticeship', 'beauty apprenticeship', 'HVAC training', 'CDL training',
    'business training', 'ETPL training provider', 'workforce funding', 'employer training partnerships',
  ],
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png', sizes: '192x192' }],
    shortcut: [{ url: '/favicon.png', type: 'image/png', sizes: '192x192' }],
    apple: [{ url: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' }],
  },
  openGraph: {
    type: 'website', siteName: 'Elevate for Humanity', url: siteUrl,
    title: 'Elevate for Humanity | Career Training & Registered Apprenticeships',
    description: 'Find a career path, understand your training and funding options, and connect with apprenticeship and employer opportunities in one place.',
    images: [{ url: logoUrl, width: 256, height: 256, alt: 'Elevate for Humanity logo' }],
  },
  robots: {
    index: true, follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'EducationalOrganization'],
  '@id': `${siteUrl}/#organization`,
  name: 'Elevate for Humanity',
  alternateName: 'Elevate for Humanity Career & Technical Institute',
  legalName: '2Exclusive LLC-S',
  url: siteUrl,
  logo: { '@type': 'ImageObject', url: logoUrl, contentUrl: logoUrl, width: 256, height: 256 },
  image: logoUrl,
  telephone: '+1-317-314-3757',
  address: { '@type': 'PostalAddress', addressLocality: 'Indianapolis', addressRegion: 'IN', addressCountry: 'US' },
  description: 'Career and technical education provider connecting learners with training, registered apprenticeships, testing and credential pathways, workforce funding navigation, employers, and supportive services.',
  knowsAbout: [
    'Registered Apprenticeship', 'Career and Technical Training', 'Barber and Beauty Apprenticeships',
    'HVAC Training', 'Commercial Driver Training', 'Business and Entrepreneurship Training',
    'Testing and Proctoring', 'Credentialing', 'Workforce Development', 'Work-Based Learning',
    'WIOA', 'Employer Services',
  ],
};

export const revalidate = 300;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <SupabasePublicConfigScript />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
      </head>
      <body className="efh-contrast">
        <SkipToContent />
        <SupabaseConfigBootstrap />
        <MarketingPwaClient />
        <ChunkRecovery />
        <GoogleAnalytics />
        <FirstPartyTraffic />
        <AssociateFormLabels />
        <I18nProvider>
          <MarketingChromeBoundary>{children}</MarketingChromeBoundary>
        </I18nProvider>
        <CookieConsent />
      </body>
    </html>
  );
}
