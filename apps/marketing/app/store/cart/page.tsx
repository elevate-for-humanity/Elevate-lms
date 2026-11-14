import type { Metadata } from 'next';
import StoreCartView from '@/components/store/StoreCartView';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review your cart and proceed to secure checkout.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const CART_ERROR_MESSAGES: Record<string, string> = {
  'payment-unavailable': 'Checkout is temporarily unavailable. Please try again later or contact support.',
  'checkout-failed': 'We could not start your checkout session. Please try again.',
  'cart-update-invalid': 'That cart quantity was not valid.',
  'cart-update-failed': 'We could not update that cart item. Please try again.',
  'cart-remove-invalid': 'That cart item could not be identified.',
  'cart-remove-failed': 'We could not remove that cart item. Please try again.',
};

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; add?: string }>;
}) {
  const { error, add } = await searchParams;
  const checkoutError = error
    ? (CART_ERROR_MESSAGES[error] ?? 'Something went wrong. Please try again.')
    : null;

  return (
    <div className="min-h-screen bg-slate-50">
      <StoreCartView checkoutError={checkoutError} addParam={add ?? null} />
    </div>
  );
}
