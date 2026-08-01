import type { Metadata } from 'next';
import './globals.css';
import './layout.css';
import Header from '@/components/site/Header';
import { SiteFooter } from '@/components/site-footer';
import { I18nProvider } from '@/lib/i18n/context';
import { ChunkRecovery } from '@/components/system/ChunkRecovery';

export const metadata: Metadata = {
  title: { default: 'Elevate for Humanity', template: '%s | Elevate for Humanity' },
  description: 'Vocational education and workforce development',
  metadataBase: new URL('https://www.elevateforhumanity.org'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ChunkRecovery />
        <I18nProvider>
          <Header />
          <main className="pt-[60px]">{children}</main>
          <SiteFooter />
        </I18nProvider>
      </body>
    </html>
  );
}
