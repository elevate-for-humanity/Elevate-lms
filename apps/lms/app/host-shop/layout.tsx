import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { default: 'Host Shop Portal', template: '%s | Elevate Host Shop' },
  description: 'Apprentices, attendance, hours, competencies, documents, and host-site reporting.',
  manifest: '/manifest-shop-owner.json',
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: 'Elevate Host Shop',
    statusBarStyle: 'black-translucent',
  },
};

export default function HostShopPortalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
