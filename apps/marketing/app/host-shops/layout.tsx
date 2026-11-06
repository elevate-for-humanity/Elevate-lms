import type { ReactNode } from 'react';
import HostShopPageNavigation from '@/components/partners/HostShopPageNavigation';

// The shared navigation reads the current approved shop directory at request time.
export const dynamic = 'force-dynamic';
export default function HostShopsLayout({ children }: { children: ReactNode }) {
  return <><HostShopPageNavigation />{children}</>;
}
