'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useStoreCart } from '@/hooks/useStoreCart';

interface StoreCartButtonProps {
  className?: string;
  variant?: 'floating' | 'inline';
}

export default function StoreCartButton({
  className = '',
  variant = 'floating',
}: StoreCartButtonProps) {
  const { cart } = useStoreCart();
  const count = cart.itemCount;

  const base =
    variant === 'floating'
      ? 'fixed bottom-24 right-4 z-40 md:bottom-8 md:right-8'
      : 'relative inline-flex';

  return (
    <Link
      href="/store/cart"
      className={`${base} group ${className}`}
      aria-label={count > 0 ? `Shopping cart, ${count} items` : 'Shopping cart'}
      data-tour="store-cart"
    >
      <span
        className={`flex items-center justify-center rounded-full shadow-lg transition-transform group-hover:scale-105 ${
          variant === 'floating'
            ? 'h-14 w-14 bg-brand-blue-600 text-white hover:bg-brand-blue-700'
            : 'h-10 w-10 bg-white border border-slate-200 text-slate-700 hover:border-brand-blue-300 hover:text-brand-blue-600'
        }`}
      >
        <ShoppingCart className={variant === 'floating' ? 'h-6 w-6' : 'h-5 w-5'} />
      </span>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[1.25rem] h-5 px-1 bg-brand-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
