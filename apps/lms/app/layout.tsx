import type { Metadata } from 'next';
import './globals.css';
import './layout.css';
import './client-polyfills';
import { LiveChatWidget } from '@/components/support/LiveChatWidget';
import { I18nProvider } from '@/lib/i18n/context';
import { LmsPwaRegistration } from '@/components/pwa/LmsPwaRegistration';
import { SupabasePublicConfigScript } from '@/components/supabase/SupabasePublicConfigScript';
import { SupabaseConfigBootstrap } from '@/components/supabase/SupabaseConfigBootstrap';
import dynamic from 'next/dynamic';

const PwaInstallBanner = dynamic(
  () => import('@/components/pwa/PwaInstallBanner').then((m) => m.PwaInstallBanner || m),
  { ssr: false },
);

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Elevate LMS', template: '%s | Elevate LMS' },
  description: 'Learning management system for vocational education',
  metadataBase: new URL('https://app.elevateforhumanity.org'),
  manifest: '/manifest-lms.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <SupabasePublicConfigScript />
      </head>
      <body>
        <SupabaseConfigBootstrap />
        <LmsPwaRegistration />
        <PwaInstallBanner />
        <I18nProvider>
          {children}
          <LiveChatWidget />
        </I18nProvider>
      </body>
    </html>
  );
}
