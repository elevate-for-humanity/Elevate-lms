import React from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import StructuredData from '@/components/StructuredData';
import PublicLayout from '@/components/layout/PublicLayout';
import { Toaster } from 'react-hot-toast';
import CookieConsent from '@/components/CookieConsent';
import { SkipToContent } from '@/components/ui/SkipToContent';
import { DMCATrackingPixel } from '@/components/InvisibleWatermark';

import { Inter } from 'next/font/google';
import { GoogleAnalytics } from '@/components/analytics/google-analytics';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  fallback: ['system-ui', '-apple-system', 'sans-serif'],
  adjustFontFallback: true,
});

// Viewport configuration (separate from metadata in Next.js 14+)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

// Global SEO configuration - canonical domain is www.elevateforhumanity.org
const SITE_URL = 'https://www.elevateforhumanity.org';
const isProduction = process.env.NODE_ENV === 'production';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'Elevate for Humanity | Career Training Programs — WIOA Funded',
    template: '%s | Elevate for Humanity',
  },

  description:
    'Learn job-ready skills through free training programs in healthcare, skilled trades, CDL, and technology. WIOA funding covers tuition for eligible Indiana residents. Enroll today and start your career.',

  // Homepage canonical - child pages should override with their own
  alternates: {
    canonical: 'https://www.elevateforhumanity.org',
  },

  keywords: [
    'free career training Indianapolis',
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

  authors: [{ name: 'Elevate for Humanity' }],

  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'Elevate for Humanity',
    title: 'Elevate for Humanity | Career Training Programs — WIOA Funded',
    description:
      'Learn job-ready skills through free training programs in healthcare, skilled trades, CDL, and technology. WIOA funding covers tuition for eligible Indiana residents.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Elevate for Humanity — free workforce training programs',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Elevate for Humanity | Career Training Programs — WIOA Funded',
    description:
      'Learn job-ready skills through free training programs in healthcare, skilled trades, CDL, and technology. WIOA funding covers tuition for eligible Indiana residents.',
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
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Simplified: Always allow indexing on production, always set canonical
  // No async header checks that could cause SSR issues
  const isProduction = process.env.NODE_ENV === 'production';

  return (
    <html lang="en" className={`light ${inter.variable}`}>
      <head>
        {!isProduction && <meta name="robots" content="noindex,nofollow" />}

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="https://widget.sezzle.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />

        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="192x192" />
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          sizes="180x180"
        />
        <meta name="theme-color" content="#dc2626" />
        {/* Preload hero image for faster LCP */}
        <link
          rel="preload"
          href="/images/hero-poster.webp"
          as="image"
          type="image/webp"
          fetchPriority="high"
        />
        {!isProduction && (
          <>
            <meta httpEquiv="Cache-Control" content="no-cache" />
            <meta httpEquiv="Pragma" content="no-cache" />
          </>
        )}
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

        {/* Critical CSS to prevent FOUC on mobile */}
        <style dangerouslySetInnerHTML={{__html: `
          *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
          html{-webkit-text-size-adjust:100%;font-family:ui-sans-serif,system-ui,-apple-system,sans-serif;background:#fff}
          body{margin:0;line-height:1.6;background:#fff;font-size:17px;min-height:100vh}
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
        `}} />
        <StructuredData />
      </head>
      <body
        className={`${inter.className} min-h-dvh bg-white antialiased`}
        style={{
          fontSize: '17px',
          backgroundColor: '#ffffff',
        }}
      >
        <SkipToContent />
        <GoogleAnalytics />
        {/* Sezzle Price Widget — waits for React hydration before checking targets */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function loadSezzle() {
                  var targets = ['.sezzle-hero-price', '.sezzle-price-target', '.product-price', '.cart-total'];
                  var hasTarget = targets.some(function(sel) { return document.querySelector(sel); });
                  if (!hasTarget) return;
                  if (window.__sezzleLoaded) return;
                  window.__sezzleLoaded = true;
                  document.sezzleConfig = {
                    configGroups: [
                      { targetXPath: ".sezzle-hero-price", renderToPath: ".sezzle-hero-widget", theme: "dark", alignment: "left" },
                      { targetXPath: ".sezzle-price-target", renderToPath: ".sezzle-widget-container", theme: "light", alignment: "left" },
                      { targetXPath: ".product-price", theme: "light", alignment: "left" },
                      { targetXPath: ".cart-total", renderToPath: ".sezzle-cart-widget", theme: "light", alignment: "right" }
                    ],
                    language: "en",
                    minPrice: 35,
                    maxPrice: 2500
                  };
                  var s = document.createElement('script');
                  s.src = 'https://widget.sezzle.com/v1/javascript/price-widget?uuid=8ac76455-16d3-44f4-9b11-64b85a80184c';
                  s.async = true;
                  document.head.appendChild(s);
                }
                // Check after hydration — retry a few times for client-rendered content
                var attempts = 0;
                var interval = setInterval(function() {
                  loadSezzle();
                  if (++attempts >= 10 || window.__sezzleLoaded) clearInterval(interval);
                }, 500);
              })();
            `,
          }}
        />
        <PublicLayout>{children}</PublicLayout>
        <CookieConsent />
        <DMCATrackingPixel />

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              borderRadius: '12px',
              fontSize: '0.875rem',
              padding: '12px 16px',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}
// Cache bust: 2026-01-09T13:15:00Z
// FORCE DEPLOYMENT: Trigger new build to replace stale production
// All fixes applied: no black text, proper headers, hashed CSS only
// Build timestamp: 2026-01-09T13:15:00Z
