import type { ReactNode } from 'react';
import HostShopPageNavigation from '@/components/partners/HostShopPageNavigation';
export default function HostShopsLayout({ children }: { children: ReactNode }) {
  return <><HostShopPageNavigation />{children}</>;
}
