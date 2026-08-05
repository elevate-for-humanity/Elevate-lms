import type { Metadata } from 'next';
import './globals.css';
import './layout.css';

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
      <body>
        {children}
      </body>
    </html>
  );
}
