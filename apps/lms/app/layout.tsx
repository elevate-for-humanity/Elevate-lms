// Production recovery deploy marker: 2026-08-13.
import type { Metadata } from 'next';
import './globals.css';
import './layout.css';
import '../../../styles/contrast-guardrails.css';
import { LmsPwaRegistration } from '@/components/pwa/LmsPwaRegistration';
import { PwaInstallBanner } from '@/components/pwa/PwaInstallBanner';
import { SupabasePublicConfigScript } from '@/components/supabase/SupabasePublicConfigScript';
import { SupabaseConfigBootstrap } from '@/components/supabase/SupabaseConfigBootstrap';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Elevate LMS', template: '%s | Elevate LMS' },
  description: 'Learning management system for vocational education',
  metadataBase: new URL('https://app.elevateforhumanity.org'),
  manifest: '/manifest-lms.json',
  applicationName: 'Elevate LMS',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: 'Elevate LMS',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#1E3A5F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <SupabasePublicConfigScript />
      </head>
      <body className="efh-contrast">
        <SupabaseConfigBootstrap />
        <LmsPwaRegistration />
        {children}
        <PwaInstallBanner
          message="Install the Elevate dashboard for faster access to courses, hours, documents, and progress."
          storageKey="lms-pwa-install-banner-dismissed"
        />
      </body>
    </html>
  );
}
