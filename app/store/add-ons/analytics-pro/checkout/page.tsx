export const dynamic = 'force-static';

import AddOnCheckout from '@/components/store/AddOnCheckout';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };


export default function AnalyticsProCheckoutPage() {
  return (
    <AddOnCheckout
      productId="analytics-pro"
      productName="Analytics Pro"
      productImage="/images/pages/admin-analytics-hero.webp"
      backHref="/store/add-ons/analytics-pro"
      oneTimePrice={1497}
      monthlyPrice={424}
      monthlyCount={4}
      accentColor="indigo"
      features={['Unlimited dashboards', 'Predictive analytics', 'Custom reports']}
    />
  );
}
