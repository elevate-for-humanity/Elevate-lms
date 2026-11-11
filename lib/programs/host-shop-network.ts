import onboardingProfiles from '@/lib/partners/host-shop-onboarding-profiles.json';
import { uniqueHostShops } from '@/lib/partners/dedupe-host-shops.mjs';
import { curateShopGallery } from '@/lib/partners/curated-shop-media';
import 'server-only';

import {
  FEATURED_BEAUTY_HOST_PARTNERS,
  getFeaturedHostPartnerBySlug,
  type FeaturedHostPartner,
} from '@/lib/apprenticeship-programs/host-partners';
import { PROGRAM_LABELS } from '@/lib/programs/host-shop-programs';
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
  const knownProfile = getFeaturedHostPartnerBySlug(approved.publicSlug ?? '');
  if (knownProfile?.slug === featured.slug) return true;
  const sameName =
    identityKey(approved.name) === identityKey(featured.name) ||
    (featured.dba ? identityKey(approved.name) === identityKey(featured.dba) : false);
  const approvedPhone = phoneKey(approved.phone);
  const featuredPhone = phoneKey(featured.phone);
  const samePhone = Boolean(approvedPhone && featuredPhone && approvedPhone === featuredPhone);
  // Independent businesses can share a campus, address, or suite. Location
  // alone must never replace a shop's identity, portfolio, or occupations.
  return sameName || samePhone;
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
    const publicProfile = onboardingProfiles.find(
      (profile) => identityKey(profile.name) === identityKey(shop.name),
    );
    const gallery = curateShopGallery(featured?.slug ?? shop.publicSlug ?? '', [
      ...(shop.mediaGallery ?? []),
      ...(publicProfile && 'gallery' in publicProfile ? (publicProfile.gallery ?? []) : []),
      ...(featured?.media
        ?.filter((item) => item.kind !== 'video')
        .map((item) => ({ url: item.src, alt: item.alt })) ?? []),
      ...(shop.logoUrl ? [{ url: shop.logoUrl, alt: `${shop.name} official business image` }] : []),
      ...(shop.flyerUrl ? [{ url: shop.flyerUrl, alt: `${shop.name} official announcement` }] : []),
    ]);
    // Lead with the shop's current curated photography, retaining its full portfolio.
    const preferredPhoto =
      featured?.slug === 'cals-kutz-studio'
        ? '/images/partners/cals-kutz/storefront-enhanced-2026.webp'
        : featured?.slug === 'top-shelf-barber-lounge'
          ? '/images/partners/top-shelf-barber-lounge/top-shelf-modern-fringe-enhanced-2026.webp'
          : undefined;
    if (preferredPhoto)
      gallery.sort((a, b) => Number(b.url === preferredPhoto) - Number(a.url === preferredPhoto));
    return {
      id: shop.id,
      slug: featured?.slug ?? shop.publicSlug!,
      name: featured?.dba ?? shop.name,
      city: shop.city || featured?.city || '',
      state: shop.state || featured?.state || 'IN',
      address: approvedAddress(shop) || (featured ? featuredAddress(featured) : ''),
      phone: featured?.phone || shop.phone || undefined,
      programs: shop.programs,
      primaryProgram: shop.primaryProgram ?? shop.programs[0],
      description:
        featured?.marketingBlurb ||
        (shop.description && !shop.description.includes('Approved Elevate Host Site record')
          ? shop.description
          : undefined) ||
        (publicProfile?.slug === 'dbo-hair-studios'
          ? 'DBO Hair Studios is an Indianapolis salon led by owner and master stylist Evelyn Estevez. Meet the team, explore their work, and book directly with the salon.'
          : `${shop.name} is located in ${shop.city}, ${shop.state}. Explore ${shop.programs.map((program) => PROGRAM_LABELS[program] ?? program).join(' and ')} at this local business. Contact the shop for services, hours, and walk-in availability.`),
      image: gallery[0]?.url,
      videoUrl: shop.videoUrl || featured?.media?.find((item) => item.kind === 'video')?.src,
      gallery,
      website: shop.website || featured?.websiteUrl || publicProfile?.website || undefined,
      social:
        featured?.socialUrl ||
        (publicProfile && 'instagram' in publicProfile ? publicProfile.instagram : undefined),
      booking:
        featured?.bookingUrl ||
        (publicProfile && 'booking' in publicProfile ? publicProfile.booking : undefined),
      approval: 'approved',
    };
  });

  const publishedOnly = FEATURED_BEAUTY_HOST_PARTNERS.filter(
    (shop) =>
      !matchedFeatured.has(shop.slug) && approved.some((record) => sameBusiness(record, shop)),
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
      primaryProgram: shop.primaryProgram ?? shop.programs[0],
      description:
        shop.marketingBlurb ||
        shop.note ||
        `${shop.name} is listed in Elevate's Host Shop network.`,
      image: firstImage(shop),
      videoUrl: shop.media?.find((item) => item.kind === 'video')?.src,
      gallery: shop.media
        ?.filter((item) => item.kind !== 'video')
        .map((item) => ({ url: item.src, alt: item.alt })),
      website: shop.websiteUrl,
      social: shop.socialUrl,
      booking: shop.bookingUrl,
      approval: 'published-partner',
    }),
  );

  // Multiple historical approval records can refer to the same public shop.
  // Keep one destination and preserve its independently approved pathways.
  return uniqueHostShops([...operational, ...publishedOnly]).sort(
    (left: HostShopNetworkEntry, right: HostShopNetworkEntry) =>
      left.city.localeCompare(right.city) || left.name.localeCompare(right.name),
  );
}
