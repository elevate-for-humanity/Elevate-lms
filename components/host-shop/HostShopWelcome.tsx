'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';

export default function HostShopWelcome({
  shopName,
  partnerId,
  profileImageUrl,
  ownerName,
  children,
}: {
  shopName: string;
  partnerId: string;
  profileImageUrl?: string | null;
  ownerName?: string | null;
  children: ReactNode;
}) {
  const [entered, setEntered] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  useEffect(() => setPhotoFailed(false), [profileImageUrl, partnerId]);
  const displayName = ownerName || shopName;
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const profileHero = (
    <div className="relative flex aspect-[16/7] items-center justify-center overflow-hidden rounded-3xl bg-neutral-950 text-white" aria-label={`${displayName} dashboard banner`}>
      {profileImageUrl && !photoFailed ? (
        <Image src={profileImageUrl} alt={`${displayName} profile photo`} fill priority sizes="(max-width: 1024px) 100vw, 75vw" className="object-contain object-top" onError={() => setPhotoFailed(true)} />
      ) : (
        <div className="p-6 text-center"><p className="text-6xl font-black sm:text-8xl">{initials}</p><p className="mt-3 text-lg font-bold">{displayName}</p><p className="mt-2 text-sm text-neutral-300">{profileImageUrl ? 'Profile photo is unavailable' : 'Profile photo has not been added'}</p></div>
      )}
    </div>
  );
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
        {profileHero}
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
      {profileHero}
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
