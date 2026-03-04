import AddOnCheckout from '@/components/store/AddOnCheckout';

export default function CommunityHubCheckoutPage() {
  return (
    <AddOnCheckout
      productId="community-hub"
      productName="Community Hub"
      productImage="/images/pages/comp-cta-training.jpg"
      backHref="/store/add-ons/community-hub"
      oneTimePrice={1997}
      monthlyPrice={549}
      monthlyCount={4}
      accentColor="brand-blue"
      features={['Unlimited members', 'Discussion forums', 'Leaderboards']}
    />
  );
}
