export const dynamic = 'force-dynamic';

import React from 'react';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import ToasterClient from '@/components/ui/ToasterClient';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { SupabasePublicConfigScript } from '@/components/supabase/SupabasePublicConfigScript';
import SupabaseConfigBootstrap from '@/components/supabase/SupabaseConfigBootstrap';

const ADMIN_METADATA_BASE =
  (process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.elevateforhumanity.org').replace(
    /\/+$/,
    '',
  );

const inter = localFont({
  src: [
    { path: '../../../public/fonts/Inter-Regular.otf', weight: '400', style: 'normal' },
    { path: '../../../public/fonts/Inter-SemiBold.otf', weight: '600', style: 'normal' },
    { path: '../../../public/fonts/Inter-Bold.otf', weight: '700', style: 'normal' },
  ],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(ADMIN_METADATA_BASE),
  title: {
    default: 'Elevate Admin',
    template: '%s | Elevate Admin',
  },
  description: `${PLATFORM_DEFAULTS.orgName} — Admin Portal`,
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/favicon.ico', type: 'image/x-icon', sizes: '32x32' },
      { url: '/favicon.png', type: 'image/png', sizes: '192x192' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <SupabasePublicConfigScript />
      </head>
      <body className="font-sans antialiased">
        <SupabaseConfigBootstrap />
        {children}
        {/* Single Toaster mount for the entire admin app — covers /admin, /instructor, /login */}
        <ToasterClient />
      </body>
    </html>
  );
}
