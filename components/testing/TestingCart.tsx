'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ShoppingCart, X, Check, CalendarDays } from 'lucide-react';
import { useCart } from '@/lib/store/use-cart';
import { addToCart, getCart } from '@/lib/store/cart';

export const TestingCartProvider = ({ children }: { children: ReactNode }) => <>{children}</>;
const PROVIDERS = ['certiport', 'careersafe', 'workkeys', 'midland', 'esco', 'nrf', 'nha'];
const money = (amount: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

interface AddExamToCartButtonProps {
  examType: string;
  examName: string;
  amountCents: number;
  active: boolean;
  className?: string;
}

export function AddExamToCartButton({
  examType,
  examName,
  amountCents,
  active,
  className,
}: AddExamToCartButtonProps) {
  const [added, setAdded] = useState(false);
  const id = `testing-${examType}-${examName}`.replace(/\s+/g, '-').toLowerCase();
  useEffect(() => {
    const sync = () => setAdded(getCart().items.some((item) => item.product.id === id));
    sync();
    window.addEventListener('cartUpdated', sync);
    return () => window.removeEventListener('cartUpdated', sync);
  }, [id]);
  if (!active || amountCents <= 0) return null;
  function add() {
    if (!getCart().items.some((item) => item.product.id === id)) {
      addToCart({
        id,
        name: examName,
        slug: id,
        category: 'certification-prep',
        price: amountCents / 100,
        description: `${examName} exam at Elevate Testing Center`,
        image: '/images/pages/testing-page-1.webp',
        inStock: true,
        featured: false,
        digital: false,
      });
    }
    setAdded(true);
    const cart = document.getElementById('testing-cart');
    cart?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
    cart?.focus({ preventScroll: true });
  }
  return (
    <button
      type="button"
      onClick={add}
      aria-label={`${added ? 'View cart for' : 'Add to cart:'} ${examName}`}
      className={
        className ??
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-red-300 px-3 py-2 text-sm font-bold text-brand-red-700 hover:bg-brand-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
      }
    >
      {added ? (
        <Check className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ShoppingCart className="h-4 w-4" aria-hidden="true" />
      )}
      {added ? 'Added — View cart' : 'Add to Cart'}
    </button>
  );
}

export default function TestingCart() {
  const { items: allItems, removeItem } = useCart();
  const items = allItems.filter((item) => item.id.startsWith('testing-'));
  const total = items.reduce((sum, item) => sum + item.price, 0);
  return (
    <aside
      id="testing-cart"
      tabIndex={-1}
      aria-labelledby="testing-cart-heading"
      className="scroll-mt-24 rounded-2xl border-2 border-brand-blue-200 bg-white p-5 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-600"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="testing-cart-heading"
          className="flex items-center gap-2 text-xl font-black text-slate-950"
        >
          <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          Your testing cart
        </h2>
        <span
          role="status"
          aria-live="polite"
          className="rounded-full bg-brand-blue-50 px-3 py-1 text-sm font-bold text-brand-blue-900"
        >
          {items.length} {items.length === 1 ? 'exam' : 'exams'}
        </span>
      </div>
      {items.length === 0 ? (
        <p className="mt-4 leading-6 text-slate-700">
          Choose an exam below and select Add to Cart. Your selected exams will appear here.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Choose a date for each exam before payment. Each exam has its own appointment and
            checkout. Group participant counts are selected during checkout.
          </p>
          <ul className="mt-4 space-y-3">
            {items.map((item) => {
              const provider = PROVIDERS.find((key) => item.id.startsWith(`testing-${key}-`));
              return (
                <li key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-950">{item.name}</h3>
                      <p className="mt-1 text-sm text-slate-700">{money(item.price)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label={`Remove ${item.name} from testing cart`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-700 hover:bg-red-50 hover:text-red-700"
                    >
                      <X className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                  {provider ? (
                    <Link
                      href={`/testing/checkout?provider=${encodeURIComponent(provider)}&exam=${encodeURIComponent(item.name)}`}
                      className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-red-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-red-700"
                    >
                      <CalendarDays className="h-4 w-4" aria-hidden="true" />
                      Choose date & checkout
                    </Link>
                  ) : (
                    <p role="alert" className="mt-3 text-sm text-red-700">
                      Remove this exam and select it again from the provider list.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-4 flex justify-between gap-3 font-bold text-slate-950">
            <span>Selected exam prices</span>
            <span>{money(total)}</span>
          </p>
          <button
            type="button"
            onClick={() => items.forEach((item) => removeItem(item.id))}
            className="mt-3 min-h-11 text-sm font-bold text-slate-700 underline"
          >
            Clear testing exams
          </button>
        </>
      )}
      <Link
        href="/testing/checkout"
        className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-bold text-brand-blue-700 underline"
      >
        See available testing dates
        <CalendarDays className="h-4 w-4" aria-hidden="true" />
      </Link>
    </aside>
  );
}
