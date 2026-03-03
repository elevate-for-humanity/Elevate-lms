import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Career Training Programs | Elevate for Humanity Education',
  description:
    'Browse career training programs in healthcare, skilled trades, technology, CDL, barbering, and business. No-cost training for eligible participants through WIOA and state workforce funding.',
  alternates: { canonical: 'https://www.elevateforhumanityeducation.com' },
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
export default function EducationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
