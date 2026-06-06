// Force all routes to render on-demand (SSR) — prevents Next from attempting
// static generation of ~2,000 pages at build time, which causes OOM in constrained build environments.
// Individual pages can override with their own `export const revalidate = N`.
export const dynamic = 'force-dynamic';

import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import StructuredData from '@/components/StructuredData';
import PublicLayout from '@/components/layout/PublicLayout';
import ToasterClient from '@/components/ui/ToasterClient';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { DMCATrackingPixel } from '@/components/InvisibleWatermark';
import { CopyrightProtection } from '@/components/CopyrightProtection';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';
import { GoogleAds } from '@/components/analytics/google-ads';
import RootWidgets from '@/components/layout/RootWidgets';
import { generateChromeSuppressionScript } from '@/lib/layout/app-routes';

import PWAManager from '@/components/PWAManager';
import { InstallPromptBanner } from '@/components/pwa/InstallPromptBanner';
import AuthRedirectHandler from '@/components/auth/AuthRedirectHandler';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { SupabasePublicConfigScript } from '@/components/supabase/SupabasePublicConfigScript';
import SupabaseConfigBootstrap from '@/components/supabase/SupabaseConfigBootstrap';

const inter = { variable: '' };

// Viewport configuration (separate from metadata in Next.js 14+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

// Global SEO configuration - canonical domain is ${PLATFORM_DEFAULTS.canonicalDomain}
const SITE_URL = PLATFORM_DEFAULTS.siteUrl;
const isProduction = process.env.NODE_ENV === 'production';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: `${PLATFORM_DEFAULTS.orgName} | Career Training at No Cost for Eligible Participants`,
    template: `%s | ${PLATFORM_DEFAULTS.orgName}`,
  },

  description:
    'Nonprofit workforce development institute in Indianapolis. Career training in healthcare, skilled trades, CDL, technology, and business at no cost to eligible Indiana residents through WIOA and state funding. Enroll today.',

  // Homepage canonical - child pages should override with their own
  alternates: {
    canonical: PLATFORM_DEFAULTS.siteUrl,
  },

  keywords: [
    'funded career training Indianapolis',
    'WIOA programs Indiana',
    'free job training Marion County',
    'HVAC training Indianapolis',
    'barber school Indianapolis',
    'healthcare training Indiana',
    'free trade school Indianapolis',
    'workforce development Indianapolis',
    'apprenticeship programs Indiana',
    'CNA training Indianapolis',
    'free medical assistant training Indianapolis',
    'free CDL training Indiana',
    'job placement Indianapolis',
    'career change Indianapolis',
    'second chance jobs Indiana',
    'reentry programs Indianapolis',
    'free esthetician school Indianapolis',
    'WIOA eligible programs',
    'WorkOne Indianapolis',
    'free vocational training Indiana',
    'paid training programs Indianapolis',
  ],

  authors: [{ name: PLATFORM_DEFAULTS.orgName }],

  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: PLATFORM_DEFAULTS.orgName,
    title: `${PLATFORM_DEFAULTS.orgName} | Career Training at No Cost for Eligible Participants`,
    description:
      'Learn job-ready skills through career training programs in healthcare, skilled trades, CDL, and technology. Training at no cost to eligible Indiana residents through WIOA and state funding.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: `${PLATFORM_DEFAULTS.orgName} — workforce training programs in Indianapolis`,
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: `${PLATFORM_DEFAULTS.orgName} | Career Training at No Cost for Eligible Participants`,
    description:
      'Learn job-ready skills through career training programs in healthcare, skilled trades, CDL, and technology. Training at no cost to eligible Indiana residents through WIOA and state funding.',
    images: ['/images/og-image.jpg'],
  },

  robots: {
    index: isProduction,
    follow: isProduction,
    nocache: !isProduction,
    googleBot: {
      index: isProduction,
      follow: isProduction,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  facebook: {
    appId: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Elevate',
  },
  verification: {
    google: '9sXnIdE4X4AoAeRlu16JXWqNxSOIxOCAvbpakSGp3so',
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || '',
    },
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Simplified: Always allow indexing on production, always set canonical
  // No async header checks that could cause SSR issues
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <html lang="en" className={`light ${inter.variable}`}>
      <head>
        {!isProduction && <meta name="robots" content="noindex,nofollow" />}

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />

        <link rel="icon" href="/favicon.png" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />
        <meta name="theme-color" content="#dc2626" />
        {/* Organization structured data — tells Google Knowledge Panel the correct logo */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: PLATFORM_DEFAULTS.orgName,
              url: PLATFORM_DEFAULTS.siteUrl,
              logo: `${PLATFORM_DEFAULTS.siteUrl}/logo.png`,
              image: `https://${PLATFORM_DEFAULTS.canonicalDomain}/images/og-image.jpg`,
              sameAs: [
                'https://www.facebook.com/elevateforhumanity',
                'https://www.linkedin.com/company/elevate-for-humanity',
              ],
            }),
          }}
        />
        {/* Prevent iOS Safari from auto-linking phone numbers/dates — causes hydration mismatches */}
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />
        {/* LCP preload is set per-page in each page's metadata/head, not globally */}
        {!isProduction && (
          <>
          </>
        )}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* Critical CSS to prevent FOUC on mobile */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          html{-webkit-text-size-adjust:100%;background:#fff}
          body{margin:0;line-height:1.6;background:#fff;font-size:17px;min-height:100vh;color:#111827}
          img{max-width:100%;height:auto;display:block}
          button,input,select,textarea{font-family:inherit;font-size:100%}
          .flex{display:flex}
          .items-center{align-items:center}
          .justify-between{justify-content:space-between}
          .gap-4{gap:1rem}
          .px-4{padding-left:1rem;padding-right:1rem}
          .py-2{padding-top:0.5rem;padding-bottom:0.5rem}
          .text-white{color:#fff}
          .text-black{color:#111827}
          .bg-white{background-color:#fff}
          .bg-brand-blue-600{background-color:#2563eb}
          .bg-brand-orange-500{background-color:#f97316}
          .rounded-md{border-radius:0.375rem}
          .font-bold{font-weight:700}
          .text-xl{font-size:1.25rem;line-height:1.75rem}
          .text-3xl{font-size:1.875rem;line-height:2.25rem}
          .mb-4{margin-bottom:1rem}
          .mb-6{margin-bottom:1.5rem}
          .max-w-7xl{max-width:80rem}
          .mx-auto{margin-left:auto;margin-right:auto}
          .grid{display:grid}
          .grid-cols-1{grid-template-columns:repeat(1,minmax(0,1fr))}
          @media(min-width:640px){.sm\\:px-6{padding-left:1.5rem;padding-right:1.5rem}}
          @media(min-width:1024px){.lg\\:px-8{padding-left:2rem;padding-right:2rem}.lg\\:grid-cols-3{grid-template-columns:repeat(3,minmax(0,1fr))}}
        `,
          }}
        />
        <StructuredData />
        <SupabasePublicConfigScript />
      </head>
      <body
        className={`min-h-dvh bg-white antialiased`}
        style={{
          fontSize: '17px',
          backgroundColor: '#ffffff',
        }}
        suppressHydrationWarning
      >
        <SupabaseConfigBootstrap />
        {/* Suppress marketing chrome on app routes before hydration — no flash on hard nav.
            suppressHydrationWarning is required because this script sets data-app-route on
            <body> before React hydrates, causing a server/client attribute mismatch. */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: generateChromeSuppressionScript(),
          }}
        />
        <SkipToContent />
        <GoogleAnalytics />
        <GoogleAds />
        <PWAManager />
        <InstallPromptBanner />
        <AuthRedirectHandler />
        <PublicLayout>{children}</PublicLayout>
        <DMCATrackingPixel />
        <CopyrightProtection />
        <RootWidgets />
        <ToasterClient />
      </body>
    </html>
  );
}
// Cache bust: 2026-01-09T13:15:00Z
// FORCE DEPLOYMENT: Trigger new build to replace stale production
// All fixes applied: no black text, proper headers, hashed CSS only
// Build timestamp: 2026-01-09T13:15:00Z
