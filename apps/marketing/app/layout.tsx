import type { Metadata } from 'next';
import './globals.css';
import './layout.css';

export const metadata: Metadata = {
  title: { default: 'Elevate for Humanity', template: '%s | Elevate for Humanity' },
  description: 'Vocational education and workforce development',
  metadataBase: new URL('https://www.elevateforhumanity.org'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
