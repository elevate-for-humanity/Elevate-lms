import type { Metadata } from 'next';
import StoreCartView from '@/components/store/StoreCartView';

export const metadata: Metadata = {
  title: 'Secure Checkout',
  description: 'Review your cart and continue to secure hosted checkout.',
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <StoreCartView />;
}
