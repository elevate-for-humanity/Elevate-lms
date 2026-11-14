'use client';

import Image from 'next/image';
import Link from 'next/link';
import { FEATURED_BEAUTY_HOST_PARTNERS } from '@/lib/apprenticeship-programs/host-partners';
import { useEffect, useState, type ReactNode } from 'react';
import VisualDashboardOrientation from '@/components/orientation/VisualDashboardOrientation';

export default function HostShopWelcome({
  shopName,
  partnerId,
  profileImageUrl,
  ownerName,
  savedImageUrl,
  savedImageAlt,
  children,
}: {
  shopName: string;
  partnerId: string;
  profileImageUrl?: string | null;
  ownerName?: string | null;
  savedImageUrl?: string | null;
  savedImageAlt?: string | null;
  children: ReactNode;
}) {
  const [failedImages, setFailedImages] = useState<string[]>([]);
  // Match complete verified business identities; never borrow another shop's photo.
  const identity = (value: string) =>
    value
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/\b(llc|inc)\b/g, '')
      .replace(/[^a-z0-9]/g, '');
  const aliases: Record<string, string> = {
    styleandscissorssalon: 'style-and-scissor-salon',
    stylesandscissors: 'style-and-scissor-salon',
    stylesandscissorssalon: 'style-and-scissor-salon',
    stylesandscissorssalonandbarber: 'style-and-scissor-salon',
    topshelfbarbershop: 'top-shelf-barber-lounge',
  };
  const shopIdentity = identity(shopName);
  const featured = FEATURED_BEAUTY_HOST_PARTNERS.find(
    (shop) =>
      shop.slug === aliases[shopIdentity] ||
      [shop.name, shop.dba, shop.slug].some((name) => name && identity(name) === shopIdentity),
  );
  const shopPhoto = featured?.media?.find((item) => item.kind === 'photo');
  const hero = [
    { src: savedImageUrl, alt: savedImageAlt || shopName },
    { src: shopPhoto?.src, alt: shopPhoto?.alt || shopName },
    { src: profileImageUrl, alt: `${ownerName || shopName} profile photo` },
  ].find((item) => item.src && !failedImages.includes(item.src));
  useEffect(() => setFailedImages([]), [savedImageUrl, profileImageUrl, partnerId]);
  const displayName = ownerName || shopName;
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
  const profileHero = (
    <div
      className="relative flex h-44 sm:h-56 lg:h-64 items-center justify-center overflow-hidden rounded-3xl bg-neutral-950 text-white"
      aria-label={`${displayName} dashboard banner`}
    >
      {hero?.src ? (
        <Image
          src={hero.src}
          unoptimized={hero.src.startsWith('https://')}
          alt={hero.alt}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 75vw"
          className="object-contain object-top"
          onError={() => setFailedImages((failed) => [...failed, hero.src!])}
        />
      ) : (
        <div className="p-6 text-center">
          <p className="text-6xl font-black sm:text-8xl">{initials}</p>
          <p className="mt-3 text-lg font-bold">{displayName}</p>
          <p className="mt-2 text-sm text-neutral-300">
            {failedImages.length ? 'Shop photo is unavailable' : 'Profile photo has not been added'}
          </p>
        </div>
      )}
    </div>
  );
  return (
    <div className="space-y-6">
      {profileHero}
      {children}
      <details className="rounded-2xl border border-slate-200 bg-white p-4 text-slate-950">
        <summary className="min-h-11 cursor-pointer text-lg font-bold">
          Watch your dashboard guide
        </summary>
        <div className="mt-4 space-y-4">
          <VisualDashboardOrientation audience="host-shop" compact />
          <Link
            href="/host-shop/orientation"
            className="inline-flex min-h-11 items-center font-bold text-blue-800 underline"
          >
            Open full orientation
          </Link>
        </div>
      </details>
    </div>
  );
}
