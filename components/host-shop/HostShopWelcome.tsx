'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';

export default function HostShopWelcome({
  shopName,
  partnerId,
  children,
}: {
  shopName: string;
  partnerId: string;
  children: ReactNode;
}) {
  const [entered, setEntered] = useState(false);
  const key = `host-shop-welcome-v2:${partnerId}`;
  useEffect(() => {
    try {
      setEntered(localStorage.getItem(key) === 'entered');
    } catch {
      setEntered(false);
    }
  }, [key]);
  function enter() {
    try {
      localStorage.setItem(key, 'entered');
    } catch {
      /* The dashboard remains usable without local storage. */
    }
    setEntered(true);
  }
  if (entered)
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setEntered(false)}
          className="min-h-11 text-sm font-bold underline"
        >
          Reopen welcome and orientation
        </button>
        {children}
      </div>
    );
  return (
    <section
      aria-label="Welcome to your Host Shop"
      className="overflow-hidden rounded-3xl bg-neutral-950 text-white"
    >
      <div className="relative aspect-[16/7]">
        <Image
          src="/images/partners/generations-hair/salon-service.webp"
          alt="A stylist working with a client in a participating salon"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 75vw"
          className="object-cover"
        />
      </div>
      <div className="space-y-5 p-5 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-200">
          Welcome, {shopName}
        </p>
        <h1 className="text-3xl font-black">Your shop. Your students. One place to begin.</h1>
        <p className="max-w-2xl leading-7">
          See how salon training, student progress, and the Barber &amp; Beauty Network fit
          together. Then open your daily workspace.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            '1. Explore your orientation',
            '2. Meet the Barber & Beauty Network',
            '3. Open your dashboard',
          ].map((label) => (
            <p key={label} className="rounded-xl border border-white/20 p-4 font-bold">
              {label}
            </p>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/host-shop/orientation"
            onClick={enter}
            className="min-h-11 rounded-xl bg-amber-100 px-5 py-3 font-bold text-neutral-950"
          >
            Start visual orientation
          </Link>
          <Link
            href="/host-shop/dashboard/community"
            onClick={enter}
            className="min-h-11 rounded-xl border border-white/40 px-5 py-3 font-bold"
          >
            Barber &amp; Beauty Network
          </Link>
          <button
            type="button"
            onClick={enter}
            className="min-h-11 rounded-xl bg-white px-5 py-3 font-bold text-neutral-950"
          >
            Open my dashboard →
          </button>
        </div>
      </div>
    </section>
  );
}
