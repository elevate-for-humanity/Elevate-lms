import { Metadata } from 'next';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { getProductBySlug } from '@/lib/store/products';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shopping Cart',
  description: 'Review your cart and proceed to checkout.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

const CART_ERROR_MESSAGES: Record<string, string> = {
  'payment-unavailable': `Checkout is temporarily unavailable. Please try again later or call ${PLATFORM_DEFAULTS.supportPhone}.`,
  'checkout-failed': 'We could not start your checkout session. Please try again.',
  'cart-update-invalid': 'That cart quantity was not valid.',
  'cart-update-failed': 'We could not update that cart item. Please try again.',
  'cart-remove-invalid': 'That cart item could not be identified.',
  'cart-remove-failed': 'We could not remove that cart item. Please try again.',
};

export default async function CartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error: errorSlug } = await searchParams;
  const checkoutError = errorSlug
    ? (CART_ERROR_MESSAGES[errorSlug] ?? 'Something went wrong. Please try again.')
    : null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-white">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <div className="mb-8 flex items-center gap-4">
            <Link href="/store" className="text-slate-700 hover:text-slate-900" aria-label="Back to store">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-950">Shopping Cart</h1>
          </div>
          <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-slate-950">Your cart is empty</h2>
            <p className="mb-6 text-slate-700">Sign in to view your cart or browse our store.</p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/login?redirect=/store/cart"
                className="inline-flex items-center justify-center bg-brand-red-600 px-6 py-3 font-medium text-white hover:bg-brand-red-700 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/store"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-6 py-3 font-medium hover:bg-slate-50"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { data: cartItems } = await supabase
    .from('cart_items')
    .select(`
      id,
      quantity,
      product:products(
        id,
        slug,
        name,
        price,
        image_url,
        type
      )
    `)
    .eq('user_id', user.id);

  const subtotal =
    cartItems?.reduce((sum: number, item: any) => {
      return sum + Number(item.product?.price || 0) * Number(item.quantity || 0);
    }, 0) || 0;
  const total = subtotal;

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Cart' }]} />
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        {checkoutError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {checkoutError}
          </div>
        )}

        <div className="mb-8 flex items-center gap-4">
          <Link href="/store" className="text-slate-700 hover:text-slate-900" aria-label="Back to store">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-950">Shopping Cart</h1>
        </div>

        {cartItems && cartItems.length > 0 ? (
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {cartItems.map((item: any) => {
                const staticProduct = getProductBySlug(item.product?.slug || '');
                const productImage = item.product?.image_url || staticProduct?.image || null;
                return (
                  <div key={item.id} className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {productImage ? (
                          <Image
                            src={productImage}
                            alt={item.product?.name || 'Store product'}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center px-2 text-center text-[10px] font-bold text-slate-700">
                            Image pending
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-950">{item.product?.name}</h3>
                        <p className="text-sm capitalize text-slate-700">{item.product?.type}</p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <form action="/api/cart/update" method="POST">
                              <input type="hidden" name="itemId" value={item.id} />
                              <input type="hidden" name="quantity" value={item.quantity - 1} />
                              <button
                                type="submit"
                                className="flex h-8 w-8 items-center justify-center rounded border hover:bg-slate-50"
                                disabled={item.quantity <= 1}
                                aria-label={`Decrease quantity for ${item.product?.name || 'item'}`}
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                            </form>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <form action="/api/cart/update" method="POST">
                              <input type="hidden" name="itemId" value={item.id} />
                              <input type="hidden" name="quantity" value={item.quantity + 1} />
                              <button
                                type="submit"
                                className="flex h-8 w-8 items-center justify-center rounded border hover:bg-slate-50"
                                aria-label={`Increase quantity for ${item.product?.name || 'item'}`}
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </form>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-950">
                              ${(Number(item.product?.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                            </span>
                            <form action="/api/cart/remove" method="POST">
                              <input type="hidden" name="itemId" value={item.id} />
                              <button
                                type="submit"
                                className="text-brand-red-600 hover:text-brand-red-800"
                                aria-label={`Remove ${item.product?.name || 'item'} from cart`}
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-8 rounded-xl border bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-slate-950">Order Summary</h2>
                <div className="mb-6 space-y-3">
                  <div className="flex justify-between text-slate-700">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3 text-lg font-bold text-slate-950">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </div>
                <form action="/api/store/cart-checkout" method="POST">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-red-600 py-3 font-semibold text-white hover:bg-brand-red-700"
                  >
                    <CreditCard className="h-5 w-5" />
                    Proceed to Checkout
                  </button>
                </form>
                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-slate-700">
                  <ShieldCheck className="h-4 w-4" />
                  Secure checkout
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
            <h2 className="mb-2 text-xl font-semibold text-slate-950">Your cart is empty</h2>
            <p className="mb-6 text-slate-700">Browse our store to find resources that support your journey.</p>
            <Link
              href="/store"
              className="inline-flex items-center justify-center rounded-lg bg-brand-red-600 px-6 py-3 font-medium text-white hover:bg-brand-red-700"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
