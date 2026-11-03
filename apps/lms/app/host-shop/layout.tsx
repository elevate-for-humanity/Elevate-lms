import { cookies } from 'next/headers';
import HostShopPreviewBoundary from '@/components/host-shop/HostShopPreviewBoundary';
import { HOST_SHOP_PREVIEW_MARKER } from '@/lib/partners/host-shop-preview-marker';
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

export default async function HostShopPortalLayout({ children }: { children: React.ReactNode }) {
  const marker = (await cookies()).get(HOST_SHOP_PREVIEW_MARKER)?.value;
  return marker ? <HostShopPreviewBoundary marker={marker}>{children}</HostShopPreviewBoundary> : children;
}
