export const dynamic = 'force-dynamic';

import AddOnCheckout from '@/components/store/AddOnCheckout';
import type { Metadata } from 'next';

export const metadata: Metadata = { robots: { index: false, follow: false } };


export default function AnalyticsProCheckoutPage() {
  return (
    <AddOnCheckout
      productId="analytics-pro"
      productName="Analytics Pro"
      productImage="https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images/images/pages/admin-analytics-hero.webp"
      backHref="/store/add-ons/analytics-pro"
      oneTimePrice={1497}
      monthlyPrice={424}
      monthlyCount={4}
      accentColor="indigo"
      features={['Unlimited dashboards', 'Predictive analytics', 'Custom reports']}
    />
  );
}
