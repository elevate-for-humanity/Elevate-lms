'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
import { useStoreCart } from '@/hooks/useStoreCart';
import { addToCart, clearCart } from '@/lib/store/cart';
import {
  isIndividualAppCartProduct,
  parseIndividualAppCartProduct,
  resolveCartAddParam,
} from '@/lib/store/resolve-cart-add';
import { createClient } from '@/lib/supabase/client';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

interface StoreCartViewProps {
  checkoutError?: string | null;
  addParam?: string | null;
}

export default function StoreCartView({ checkoutError, addParam }: StoreCartViewProps) {
  const router = useRouter();
  const { cart, removeItem, setQuantity, refresh } = useStoreCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!addParam) return;
    const product = resolveCartAddParam(addParam);
    if (!product) {
      setCheckoutMessage('That product could not be added. Browse the store and try again.');
      return;
    }
    addToCart(product, 1);
    setAddedNotice(`${product.name} added to your cart.`);
    refresh();
    router.replace('/store/cart', { scroll: false });
  }, [addParam, refresh, router]);

  const subtotal = cart.total;
  const tax = subtotal * 0.07;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.items.length === 0) return;
    setCheckingOut(true);
    setCheckoutMessage(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const individualItem = cart.items.find((item) =>
        isIndividualAppCartProduct(item.product.id),
      );

      if (individualItem) {
        if (!user) {
          window.location.href = `/login?redirect=${encodeURIComponent('/store/cart')}`;
          return;
        }
        const parsed = parseIndividualAppCartProduct(individualItem.product.id);
        if (!parsed) throw new Error('Invalid subscription item');

        const res = await fetch('/api/apps/upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appSlug: parsed.appSlug, plan: parsed.planId }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Checkout failed');
        }
        if (data.checkoutUrl) {
          clearCart();
          window.location.href = data.checkoutUrl;
          return;
        }
        throw new Error('No checkout URL returned');
      }

      if (!user) {
        window.location.href = `/login?redirect=${encodeURIComponent('/store/cart')}`;
        return;
      }

      const syncRes = await fetch('/api/store/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map((item) => ({
            slug: item.product.slug,
            quantity: item.quantity,
          })),
        }),
      });
      const syncData = await syncRes.json();
      if (!syncRes.ok) {
        throw new Error(syncData.error || 'Could not prepare checkout');
      }

      const form = document.getElementById('store-cart-checkout-form') as HTMLFormElement | null;
      form?.requestSubmit();
    } catch (err) {
      setCheckoutMessage(
        err instanceof Error
          ? err.message
          : `Checkout failed. Call ${PLATFORM_DEFAULTS.supportPhone} for help.`,
      );
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {checkoutError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {checkoutError}
        </div>
      )}
      {addedNotice && (
        <div className="mb-6 rounded-lg border border-brand-green-200 bg-brand-green-50 px-4 py-3 text-sm text-brand-green-800">
          {addedNotice}
        </div>
      )}
      {checkoutMessage && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {checkoutMessage}
        </div>
      )}

      <div className="flex items-center gap-4 mb-8">
        <Link href="/store" className="text-slate-700 hover:text-slate-900" aria-label="Back to store">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Shopping Cart</h1>
        {cart.itemCount > 0 && (
          <span className="text-sm text-slate-500">
            {cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {cart.items.length > 0 ? (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => (
              <div key={item.product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex gap-4">
                  <div className="relative w-20 h-20 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                    <Image
                      src={item.product.image || '/images/pages/store-hero.webp'}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{item.product.name}</h3>
                    <p className="text-sm text-slate-600 capitalize">{item.product.category.replace(/-/g, ' ')}</p>
                    <div className="flex items-center justify-between mt-3 gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuantity(item.product.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded hover:bg-slate-50"
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(item.product.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded hover:bg-slate-50"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-slate-900">
                          ${(item.product.salePrice ?? item.product.price) * item.quantity}
                          <span className="text-xs font-normal text-slate-500">/mo</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id)}
                          className="text-brand-red-500 hover:text-brand-red-700"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4 text-slate-900">Order Summary</h2>
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-slate-700">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Est. tax (7%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3 flex justify-between font-bold text-lg text-slate-900">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full flex items-center justify-center gap-2 bg-brand-red-600 text-white py-3 rounded-lg font-semibold hover:bg-brand-red-700 disabled:opacity-60"
              >
                {checkingOut ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CreditCard className="w-5 h-5" />
                )}
                Proceed to Checkout
              </button>

              <form id="store-cart-checkout-form" action="/api/store/cart-checkout" method="POST" className="hidden">
                <input type="hidden" name="customerEmail" value="" />
              </form>

              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-slate-600">
                <ShieldCheck className="w-4 h-4" />
                Secure checkout
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-slate-400" />
          <h2 className="text-xl font-semibold mb-2 text-slate-900">Your cart is empty</h2>
          <p className="text-slate-600 mb-6">
            Add apps, workbooks, or platform plans from the store.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/store/apps"
              className="inline-flex items-center justify-center gap-2 bg-brand-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-red-700"
            >
              Browse Apps
            </Link>
            <Link
              href="/store/plans"
              className="inline-flex items-center justify-center gap-2 border border-slate-300 px-6 py-3 rounded-lg font-medium hover:bg-slate-50 text-slate-900"
            >
              View Plans
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
