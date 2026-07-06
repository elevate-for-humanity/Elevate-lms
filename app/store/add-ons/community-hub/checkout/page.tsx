export const dynamic = 'force-static';

import AddOnCheckout from '@/components/store/AddOnCheckout';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };


export default function CommunityHubCheckoutPage() {
  return (
    <AddOnCheckout
      productId="community-hub"
      productName="Community Hub"
      productImage="/images/pages/about-partners-hero.webp"
      backHref="/store/add-ons/community-hub"
      oneTimePrice={1997}
      monthlyPrice={549}
      monthlyCount={4}
      accentColor="brand-blue"
      features={['Unlimited members', 'Discussion forums', 'Leaderboards']}
    />
  );
}
