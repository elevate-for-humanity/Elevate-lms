'use client';

import { useMemo, useState } from 'react';
import { ShoppingCart, X } from 'lucide-react';

export type CatalogMicrocourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  duration_hours: number | null;
  retail_price_cents: number;
  currency: string;
  microcourse_providers: { display_name: string } | null;
};

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);

export default function MicrocourseCart({ courses }: { courses: CatalogMicrocourse[] }) {
  const [cart, setCart] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const chosen = useMemo(() => courses.filter((course) => cart.includes(course.slug)), [cart, courses]);
  const total = chosen.reduce((sum, course) => sum + course.retail_price_cents, 0);

  function toggle(slug: string) {
    setCart((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);
  }

  async function checkout(slugs: string[]) {
    if (!slugs.length) return;
    setBusy(true);
    try {
      const response = await fetch('/api/microcourses/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slugs }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.url) throw new Error(payload.error || 'Checkout is unavailable');
      window.location.assign(payload.url);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Checkout is unavailable');
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((course) => {
          const selected = cart.includes(course.slug);
          return (
            <article key={course.id} className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-blue-700">{course.microcourse_providers?.display_name}</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-950">{course.title}</h2>
              <p className="mt-3 flex-1 text-slate-600">{course.description}</p>
              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="text-2xl font-black">{money(course.retail_price_cents, course.currency)}</p>
                  <p className="text-xs text-slate-500">Installments may be available at Stripe checkout.</p>
                </div>
                <button onClick={() => checkout([course.slug])} disabled={busy}
                  className="rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-60">
                  Pay now
                </button>
              </div>
              <button onClick={() => toggle(course.slug)}
                className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-4 py-3 font-semibold">
                {selected ? <X size={18} /> : <ShoppingCart size={18} />}
                {selected ? 'Remove from cart' : 'Add to cart'}
              </button>
            </article>
          );
        })}
      </div>
      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-24">
        <div className="flex items-center gap-2"><ShoppingCart /><h2 className="text-xl font-bold">Cart ({chosen.length})</h2></div>
        {chosen.length === 0 ? <p className="mt-4 text-slate-600">Add a microcourse to begin.</p> :
          <ul className="mt-4 divide-y">{chosen.map((course) =>
            <li key={course.id} className="flex justify-between gap-4 py-3"><span>{course.title}</span><strong>{money(course.retail_price_cents, course.currency)}</strong></li>)}</ul>}
        <div className="mt-5 flex justify-between text-lg"><span>Total</span><strong>{money(total, chosen[0]?.currency || 'usd')}</strong></div>
        <button onClick={() => checkout(cart)} disabled={!chosen.length || busy}
          className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 font-bold text-white disabled:opacity-50">
          {busy ? 'Opening Stripe…' : 'Checkout'}
        </button>
      </aside>
    </div>
  );
}
