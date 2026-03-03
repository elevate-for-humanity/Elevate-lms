import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Elevate Connects | Dashboards & Portals',
  description:
    'Access your personalized dashboard. Student, employer, partner, staff, and admin portals for the Elevate for Humanity platform.',
  alternates: { canonical: 'https://www.elevateconnects.org' },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/favicon.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
};

// Standalone layout — this page renders its own nav and footer
export default function ConnectsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
