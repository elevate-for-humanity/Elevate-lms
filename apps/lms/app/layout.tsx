import type { Metadata } from 'next';
import './globals.css';
import './layout.css';
import './client-polyfills';
import { LiveChatWidget } from '@/components/support/LiveChatWidget';
import { I18nProvider } from '@/lib/i18n/context';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { default: 'Elevate LMS', template: '%s | Elevate LMS' },
  description: 'Learning management system for vocational education',
  metadataBase: new URL('https://app.elevateforhumanity.org'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <I18nProvider>
          {children}
          <LiveChatWidget />
        </I18nProvider>
      </body>
    </html>
  );
}
