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

/**
 * Canonical public network: approved operational records are authoritative.
 * Curated profiles enrich approved records; saved media and onboarding alone
 * never establish approval or publish an additional business.
 */
export async function getHostShopNetwork(includeOnboarding = false): Promise<HostShopNetworkEntry[]> {
  // Compatibility parameter must never publish incomplete onboarding records.
  void includeOnboarding;
  const approved = await getApprovedShops();

  const operational = approved.map((shop): HostShopNetworkEntry => {
    const featured = FEATURED_BEAUTY_HOST_PARTNERS.find((candidate) =>
      sameBusiness(shop, candidate),
    );

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
        ? '/images/partners/cals-kutz/client-cut-enhanced-2026.webp'
        : featured?.slug === 'top-shelf-barber-lounge'
          ? '/images/partners/top-shelf-barber-lounge/top-shelf-modern-fringe-enhanced-2026.webp'
          : featured?.slug === 'kountry-kutz-barbershop'
            ? '/images/partners/kountry-kutz/interior-active-enhanced-2026.webp'
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
      phone: featured?.phone || shop.phone || publicProfile?.phone || undefined,
      programs: shop.programs,
      primaryProgram: shop.primaryProgram ?? shop.programs[0],
      description:
        (shop.description && !/Approved Elevate Host Site(?: record)? for/.test(shop.description)
          ? shop.description
          : undefined) ||
        publicProfile?.businessDescription ||
        featured?.marketingBlurb ||
        (publicProfile?.slug === 'dbo-hair-studios'
          ? 'DBO Hair Studios is an Indianapolis salon led by owner and master stylist Evelyn Estevez. Meet the team, explore their work, and book directly with the salon.'
          : `${shop.name} is located in ${shop.city}, ${shop.state}. Explore ${shop.programs.map((program) => PROGRAM_LABELS[program] ?? program).join(' and ')} at this local business. Contact the shop for services, hours, and walk-in availability.`),
      image: gallery[0]?.url,
      logo: shop.logoUrl || (publicProfile && 'logo' in publicProfile ? publicProfile.logo : undefined) || featured?.media?.find((item) => /\/logo\./.test(item.src))?.src,
      videoUrl: shop.videoUrl || featured?.media?.find((item) => item.kind === 'video')?.src,
      // Only intentionally scripted assets replace their recorded audio with narration.
      videoScript: featured?.media?.find((item) => item.kind === 'video' && item.src === (shop.videoUrl || featured?.media?.find((media) => media.kind === 'video')?.src))?.script,
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

  // Multiple historical approval records can refer to the same public shop.
  // Keep one destination and preserve its independently approved pathways.
  return uniqueHostShops(operational).sort(
    (left: HostShopNetworkEntry, right: HostShopNetworkEntry) =>
      left.city.localeCompare(right.city) || left.name.localeCompare(right.name),
  );
}
