import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Image from 'next/image';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import StoreCartView from '@/components/store/StoreCartView';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review your cart and proceed to checkout.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const CART_ERROR_MESSAGES: Record<string, string> = {
  'payment-unavailable': `Checkout is temporarily unavailable. Please try again later or call ${PLATFORM_DEFAULTS.supportPhone}.`,
  'checkout-failed': 'We could not start your checkout session. Please try again.',
};

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; add?: string }>;
}) {
  const { error: errorSlug, add } = await searchParams;
  const checkoutError = errorSlug
    ? (CART_ERROR_MESSAGES[errorSlug] ?? 'Something went wrong. Please try again.')
    : null;

  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image
          src="/images/pages/store-cart-hero.jpg"
          alt="Elevate store"
          fill
          sizes="100vw"
          className="object-cover"
          priority
          
        />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Cart' }]} />
      </div>
      <StoreCartView checkoutError={checkoutError} addParam={add ?? null} />
    </div>
  );
}
