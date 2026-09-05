import 'server-only';

import {
  FEATURED_BEAUTY_HOST_PARTNERS,
  type FeaturedHostPartner,
} from '@/lib/apprenticeship-programs/host-partners';
import { getApprovedShops, type HostShop } from '@/lib/programs/host-shops';
import type { HostShopNetworkEntry } from '@/lib/programs/host-shop-network-types';
export type { HostShopNetworkEntry } from '@/lib/programs/host-shop-network-types';

function identityKey(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((token) => (token.length > 3 && token.endsWith('s') ? token.slice(0, -1) : token))
    .filter(
      (token) =>
        !['and', 'llc', 'inc', 'dba', 'studio', 'salon', 'barbershop', 'barber', 'shop'].includes(
          token,
        ),
    )
    .join('');
}

function addressKey(value: string) {
  return value
    .toLowerCase()
    .replace(/\b(suite|ste)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function phoneKey(value?: string) {
  return (value ?? '').replace(/\D/g, '').slice(-10);
}

function featuredAddress(shop: FeaturedHostPartner) {
  return [shop.address, shop.city, shop.state, shop.zip].filter(Boolean).join(', ');
}

function approvedAddress(shop: HostShop) {
  return [shop.address, shop.city, shop.state, shop.zip].filter(Boolean).join(', ');
}

function sameBusiness(approved: HostShop, featured: FeaturedHostPartner) {
  const sameName =
    identityKey(approved.name) === identityKey(featured.name) ||
    (featured.dba ? identityKey(approved.name) === identityKey(featured.dba) : false);
  const approvedPhone = phoneKey(approved.phone);
  const featuredPhone = phoneKey(featured.phone);
  const samePhone = Boolean(approvedPhone && featuredPhone && approvedPhone === featuredPhone);
  const sameAddress =
    Boolean(
      approved.address &&
      featured.address &&
      (addressKey(approved.address).includes(addressKey(featured.address)) ||
        addressKey(featured.address).includes(addressKey(approved.address))),
    ) && approved.city.toLowerCase() === featured.city.toLowerCase();
  return sameName || samePhone || sameAddress;
}

function firstImage(shop: FeaturedHostPartner) {
  return shop.media?.find((item) => item.kind !== 'video')?.src;
}

/**
 * Canonical public network: approved operational records are authoritative.
 * Curated profiles enrich those records and preserve published partner profiles
 * during temporary database outages without creating duplicate businesses.
 */
export async function getHostShopNetwork(): Promise<HostShopNetworkEntry[]> {
  const approved = await getApprovedShops();
  const matchedFeatured = new Set<string>();

  const operational = approved.map((shop): HostShopNetworkEntry => {
    const featured = FEATURED_BEAUTY_HOST_PARTNERS.find((candidate) =>
      sameBusiness(shop, candidate),
    );
    if (featured) matchedFeatured.add(featured.slug);
    return {
      id: shop.id,
      slug: featured?.slug ?? shop.publicSlug!,
      name: featured?.dba ?? shop.name,
      city: shop.city || featured?.city || '',
      state: shop.state || featured?.state || 'IN',
      address: approvedAddress(shop) || (featured ? featuredAddress(featured) : ''),
      phone: featured?.phone || shop.phone || undefined,
      programs: shop.programs.length ? shop.programs : (featured?.programs ?? []),
      description:
        featured?.marketingBlurb ||
        shop.description ||
        `${shop.name} participates in Elevate's apprenticeship Host Site network.`,
      image: featured
        ? firstImage(featured)
        : shop.logoUrl || shop.flyerUrl || shop.mediaGallery?.[0]?.url,
      website: featured?.websiteUrl || shop.website,
      social: featured?.socialUrl,
      booking: featured?.bookingUrl,
      approval: 'approved',
    };
  });

  const publishedOnly = FEATURED_BEAUTY_HOST_PARTNERS.filter(
    (shop) => !matchedFeatured.has(shop.slug),
  ).map(
    (shop): HostShopNetworkEntry => ({
      id: `featured:${shop.slug}`,
      slug: shop.slug,
      name: shop.dba ?? shop.name,
      city: shop.city,
      state: shop.state,
      address: featuredAddress(shop),
      phone: shop.phone,
      programs: shop.programs,
      description:
        shop.marketingBlurb ||
        shop.note ||
        `${shop.name} is listed in Elevate's Host Shop network.`,
      image: firstImage(shop),
      website: shop.websiteUrl,
      social: shop.socialUrl,
      booking: shop.bookingUrl,
      approval: 'published-partner',
    }),
  );

  return [...operational, ...publishedOnly].sort(
    (left, right) => left.city.localeCompare(right.city) || left.name.localeCompare(right.name),
  );
}
