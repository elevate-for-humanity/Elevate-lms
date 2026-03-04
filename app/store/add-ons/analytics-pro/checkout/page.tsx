import AddOnCheckout from '@/components/store/AddOnCheckout';

export default function AnalyticsProCheckoutPage() {
  return (
    <AddOnCheckout
      productId="analytics-pro"
      productName="Analytics Pro"
      productImage="/images/pages/comp-cta-training.jpg"
      backHref="/store/add-ons/analytics-pro"
      oneTimePrice={1497}
      monthlyPrice={424}
      monthlyCount={4}
      accentColor="indigo"
      features={['Unlimited dashboards', 'Predictive analytics', 'Custom reports']}
    />
  );
}
