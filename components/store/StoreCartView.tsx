'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CreditCard, Loader2, Minus, Plus, ShieldCheck, ShoppingCart, Trash2 } from 'lucide-react';
import { useStoreCart } from '@/hooks/useStoreCart';
import { addToCart, clearCart } from '@/lib/store/cart';
import { isIndividualAppCartProduct, parseIndividualAppCartProduct, resolveCartAddParam } from '@/lib/store/resolve-cart-add';
import { createClient } from '@/lib/supabase/client';

interface Props { checkoutError?: string | null; addParam?: string | null }

export default function StoreCartView({ checkoutError, addParam }: Props) {
  const router = useRouter();
  const { cart, removeItem, setQuantity, refresh } = useStoreCart();
  const [checkingOut, setCheckingOut] = useState(false);
  const [message, setMessage] = useState<string | null>(checkoutError ?? null);

  useEffect(() => {
    if (!addParam) return;
    const product = resolveCartAddParam(addParam);
    if (!product) {
      setMessage('That product could not be added.');
      return;
    }
    addToCart(product, 1);
    refresh();
    router.replace('/store/cart', { scroll: false });
  }, [addParam, refresh, router]);

  const checkout = async () => {
    if (!cart.items.length) return;
    setCheckingOut(true);
    setMessage(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = `https://app.elevateforhumanity.org/login?redirect=${encodeURIComponent('https://www.elevateforhumanity.org/store/cart')}`;
        return;
      }

      const individual = cart.items.find((item) => isIndividualAppCartProduct(item.product.id));
      if (individual) {
        if (cart.items.length !== 1) throw new Error('App subscriptions must be checked out separately from store products.');
        const parsed = parseIndividualAppCartProduct(individual.product.id);
        if (!parsed) throw new Error('Invalid app subscription');
        const response = await fetch('/api/apps/upgrade', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ appSlug: parsed.appSlug, plan: parsed.planId }) });
        const data = await response.json();
        if (!response.ok || !data.checkoutUrl) throw new Error(data.error || 'Could not start app checkout');
        clearCart();
        window.location.href = data.checkoutUrl;
        return;
      }

      const response = await fetch('/api/store/cart-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart.items.map((item) => ({ slug: item.product.slug, quantity: item.quantity })) }),
      });
      const data = await response.json();
      if (!response.ok || !data.checkoutUrl) throw new Error(data.error || 'Could not start secure checkout');
      window.location.href = data.checkoutUrl;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center gap-4"><Link href="/store" aria-label="Back to store" className="rounded-lg p-2 hover:bg-slate-100"><ArrowLeft className="h-5 w-5" /></Link><div><h1 className="text-2xl font-black text-slate-950">Shopping Cart</h1><p className="text-sm text-slate-500">{cart.itemCount} item{cart.itemCount === 1 ? '' : 's'}</p></div></div>
      {message && <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{message}</div>}

      {!cart.items.length ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-12 text-center"><ShoppingCart className="mx-auto h-14 w-14 text-slate-300" /><h2 className="mt-4 text-xl font-black">Your cart is empty</h2><div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/store" className="rounded-xl bg-brand-red-600 px-6 py-3 font-bold text-white">Browse Store</Link><Link href="/store/plans" className="rounded-xl border border-slate-300 px-6 py-3 font-bold">View Plans</Link></div></section>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <section className="space-y-4">
            {cart.items.map((item) => <article key={item.product.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4"><div className="relative h-20 w-20 flex-none overflow-hidden rounded-xl bg-slate-100"><Image src={item.product.image || '/images/pages/store-hero.webp'} alt={item.product.name} fill sizes="80px" className="object-cover" /></div><div className="min-w-0 flex-1"><h2 className="font-black text-slate-950">{item.product.name}</h2><p className="mt-1 text-sm capitalize text-slate-500">{item.product.category.replace(/-/g, ' ')}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><button onClick={() => setQuantity(item.product.id, item.quantity - 1)} disabled={item.quantity <= 1} aria-label="Decrease quantity" className="rounded-lg border p-2 disabled:opacity-40"><Minus className="h-4 w-4" /></button><span className="w-8 text-center font-bold">{item.quantity}</span><button onClick={() => setQuantity(item.product.id, item.quantity + 1)} aria-label="Increase quantity" className="rounded-lg border p-2"><Plus className="h-4 w-4" /></button></div><div className="flex items-center gap-4"><span className="font-black">${((item.product.salePrice ?? item.product.price) * item.quantity).toFixed(2)}</span><button onClick={() => removeItem(item.product.id)} aria-label={`Remove ${item.product.name}`} className="text-brand-red-600"><Trash2 className="h-5 w-5" /></button></div></div></div></article>)}
          </section>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-6 lg:sticky lg:top-24"><h2 className="text-lg font-black">Order summary</h2><div className="mt-5 flex justify-between text-slate-700"><span>Store subtotal</span><span className="font-black text-slate-950">${cart.total.toFixed(2)}</span></div><p className="mt-3 text-xs leading-5 text-slate-500">The server revalidates every item and price before creating Stripe Checkout. Shipping details are requested for physical products.</p><button onClick={checkout} disabled={checkingOut} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-red-600 py-3.5 font-black text-white hover:bg-brand-red-700 disabled:opacity-60">{checkingOut ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}{checkingOut ? 'Opening secure checkout…' : 'Proceed to Checkout'}</button><div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500"><ShieldCheck className="h-4 w-4" />Server-validated checkout</div></aside>
        </div>
      )}
    </main>
  );
}
