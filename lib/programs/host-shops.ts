/**
 * Canonical approved Host Shop loader.
 * Operational approval remains authoritative; public partner profiles only enrich
 * approved records with promotional media, website, and source-verified public contact data.
 */

import { getFeaturedHostPartnerBySlug } from '@/lib/apprenticeship-programs/host-partners';
import { requireAdminClient } from '@/lib/supabase/admin';

export type HostShopMedia = { url: string; alt?: string; source?: string };

export type HostShop = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  supervisor: string;
  programs: string[];
  primaryProgram?: string;
  badge: string;
  publicSlug?: string;
  description?: string;
  website?: string;
  googleMapsUrl?: string;
  logoUrl?: string;
  flyerUrl?: string;
  videoUrl?: string;
  mediaGallery?: HostShopMedia[];
};

import { PROGRAM_SLUGS, PROGRAM_LABELS, matchesHostShopProgram, normalizeHostShopProgram, type ProgramKey } from '@/lib/programs/host-shop-programs';
export { PROGRAM_SLUGS, PROGRAM_LABELS, normalizeHostShopProgram, type ProgramKey } from '@/lib/programs/host-shop-programs';

function parseAddress(raw: string): { address: string; city: string; state: string; zip: string } {
  const parts = raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length < 2) return { address: raw.trim(), city: '', state: 'IN', zip: '' };
  const stateZipPart = parts.at(-1) ?? '';
  const stateZipMatch = stateZipPart.match(/^([A-Za-z]{2})(?:\s+(\d{5}(?:-\d{4})?))?$/);
  if (stateZipMatch && parts.length >= 3) {
    return {
      address: parts.slice(0, -2).join(', '),
      city: parts.at(-2) ?? '',
      state: stateZipMatch[1].toUpperCase(),
      zip: stateZipMatch[2] ?? '',
    };
  }
  return { address: parts.slice(0, -1).join(', '), city: parts.at(-1) ?? '', state: 'IN', zip: '' };
}

function digits(value: string | null | undefined) {
  return (value ?? '').replace(/\D/g, '');
}

function businessKey(value: string | null | undefined) {
  return (value ?? '')
    .toLowerCase()
    .replace(/\b(llc|inc|dba|studio|salon|barbershop|barber shop)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function publicSlug(name: string, id: string) {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'host-shop';
  return `${base}-${id.replace(/-/g, '').slice(0, 8)}`;
}

function parseMedia(value: unknown): HostShopMedia[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value
    .map((item): HostShopMedia | null => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Record<string, unknown>;
      if (typeof row.url !== 'string' || !row.url) return null;
      const url = row.url.trim();
      if (!url || seen.has(url)) return null;
      seen.add(url);
      return {
        url,
        alt: typeof row.alt === 'string' ? row.alt : undefined,
        source: typeof row.source === 'string' ? row.source : undefined,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);
}

function isPubliclyListedHostShop(shop: HostShop): boolean {
  return Boolean(shop.name.trim());
}

function approvedAddress(shop: HostShop) {
  return [shop.address, shop.city, shop.state, shop.zip].filter(Boolean).join(', ');
}

function approvedMapsUrl(shop: HostShop) {
  const value = approvedAddress(shop);
  return value
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name} ${value}`)}`
    : undefined;
}

function approvedDescription(shop: HostShop) {
  const programNames = shop.programs.map((slug) => PROGRAM_LABELS[slug] ?? slug);
  const location = [shop.city, shop.state].filter(Boolean).join(', ');
  const pathways = programNames.length === 1 ? programNames[0] : programNames.join(' and ');
  return `${shop.name}${location ? ` — ${location}` : ''}. Approved Elevate Host Site record for ${pathways}.`;
}

export async function getApprovedShops(program?: ProgramKey): Promise<HostShop[]> {
  const db = await requireAdminClient();

  const [barberResult, hostResult, publicResult] = await Promise.all([
    db
      .from('barbershop_partner_applications')
      .select(
        'id, shop_legal_name, shop_dba_name, shop_address_line1, shop_city, shop_state, shop_zip, contact_phone, contact_email, supervisor_name',
      )
      .eq('status', 'approved')
      .order('shop_legal_name'),
    db
      .from('host_shop_applications')
      .select('id, shop_name, address, phone, email, intake, approved_by')
      .eq('status', 'approved')
      .or('approved_by.is.null,approved_by.neq.system_verification')
      .order('shop_name'),
    db
      .from('public_host_shops')
      .select(
        'id, public_slug, display_name, description, logo_url, flyer_url, website_url, website, phone, address_line1, address_line2, city, state, zip, programs, media_gallery, video_url, source_url',
      ),
  ]);

  for (const result of [barberResult, hostResult, publicResult]) {
    if (result.error) throw new Error(`HOST_SHOP_DIRECTORY_QUERY_FAILED:${result.error.message}`);
  }
  const barberRows = barberResult.data;
  const hostRows = hostResult.data;
  const publicRows = publicResult.data;

  const barberShops: HostShop[] = (barberRows ?? []).map((shop) => ({
    id: shop.id,
    name: shop.shop_dba_name || shop.shop_legal_name,
    address: shop.shop_address_line1 ?? '',
    city: shop.shop_city ?? '',
    state: shop.shop_state ?? 'IN',
    zip: shop.shop_zip ?? '',
    phone: shop.contact_phone ?? '',
    email: shop.contact_email ?? '',
    supervisor: shop.supervisor_name ?? '',
    programs: [PROGRAM_SLUGS.barber],
    badge: 'partner',
  }));

  const hostShops: HostShop[] = (hostRows ?? []).map((shop) => {
    const parsed = parseAddress(shop.address ?? '');
    const rawPrograms: unknown[] = Array.isArray(shop.intake?.programs) ? shop.intake.programs : [];
    const profile = (publicRows ?? []).find((row) => businessKey(row.display_name) === businessKey(shop.shop_name));
    const profilePrograms = Array.isArray(profile?.programs) ? profile.programs : [];
    const programs = [...rawPrograms, ...profilePrograms]
      .map(normalizeHostShopProgram)
      .filter((value): value is string => typeof value === 'string');
    return {
      id: shop.id,
      name: shop.shop_name,
      ...parsed,
      phone: shop.phone ?? '',
      email: shop.email ?? '',
      supervisor: '',
      programs: [...new Set(programs)],
      badge: 'partner',
    };
  });

  const barberNameMap = new Map(barberShops.map((shop) => [businessKey(shop.name), shop]));
  barberShops.forEach((barberShop) => {
    const match = hostShops.find(
      (hostShop) => businessKey(hostShop.name) === businessKey(barberShop.name),
    );
    if (match) barberShop.programs = [...new Set([...barberShop.programs, ...match.programs])];
  });

  const applicationBacked = [
    ...barberShops,
    ...hostShops.filter((shop) => !barberNameMap.has(businessKey(shop.name))),
  ]
    .filter(isPubliclyListedHostShop)
    .map((shop) => {
      const profile = (publicRows ?? []).find((row) => {
        const phoneMatch = digits(shop.phone) && digits(shop.phone) === digits(row.phone);
        const addressMatch =
          businessKey(shop.address) &&
          businessKey(shop.address) === businessKey(row.address_line1) &&
          businessKey(shop.city) === businessKey(row.city);
        const nameMatch =
          businessKey(shop.name) && businessKey(shop.name) === businessKey(row.display_name);
        return Boolean(phoneMatch || addressMatch || nameMatch);
      });

      const sourceVerifiedPublicPhone =
        profile?.phone && (profile.source_url || profile.website_url || profile.website)
          ? profile.phone
          : shop.phone;
      const enriched: HostShop = {
        ...shop,
        programs: [...new Set([...shop.programs, ...(Array.isArray(profile?.programs) ? profile.programs : [])
          .map(normalizeHostShopProgram).filter((value): value is string => Boolean(value))])],
        primaryProgram: (Array.isArray(profile?.programs) ? profile.programs : [])
          .map(normalizeHostShopProgram).find((value): value is string => Boolean(value)) ?? shop.programs[0],
        phone: sourceVerifiedPublicPhone || shop.phone,
        // Every approved operational Host Site needs a stable public destination,
        // even before optional promotional media is added to public_host_shops.
        publicSlug: profile?.public_slug ?? publicSlug(shop.name, shop.id),
        description: profile?.description || approvedDescription(shop),
        website: profile?.website_url || profile?.website || undefined,
        googleMapsUrl: approvedMapsUrl(shop),
        logoUrl: profile?.logo_url ?? undefined,
        flyerUrl: profile?.flyer_url ?? undefined,
        videoUrl: profile?.video_url ?? undefined,
        mediaGallery: parseMedia(profile?.media_gallery),
      };
      return enriched;
    });

  // The approved partner directory is also an operational approval source.
  // Include approved public profiles that predate the newer application tables
  // instead of returning a 404 for an otherwise active Host Shop.
  const matchedProfileIds = new Set(
    applicationBacked
      .map((shop) => (publicRows ?? []).find((row) => row.public_slug === shop.publicSlug)?.id)
      .filter(Boolean),
  );
  const directoryBacked: HostShop[] = (publicRows ?? [])
    .filter((row) => !matchedProfileIds.has(row.id))
    .map((row) => {
      const programs = (Array.isArray(row.programs) ? row.programs : [])
        .map(normalizeHostShopProgram)
        .filter((value): value is string => typeof value === 'string');
      return {
        id: row.id,
        name: row.display_name,
        address: row.address_line1 ?? '',
        city: row.city ?? '',
        state: row.state ?? 'IN',
        zip: row.zip ?? '',
        phone: row.phone ?? '',
        email: '',
        supervisor: '',
        programs: [...new Set(programs)],
        primaryProgram: programs[0],
        badge: 'partner',
        publicSlug: row.public_slug,
        description: row.description ?? undefined,
        website: row.website_url || row.website || undefined,
        googleMapsUrl: approvedMapsUrl({
          id: row.id,
          name: row.display_name,
          address: row.address_line1 ?? '',
          city: row.city ?? '',
          state: row.state ?? 'IN',
          zip: row.zip ?? '',
          phone: row.phone ?? '',
          email: '',
          supervisor: '',
          programs,
          badge: 'partner',
        }),
        logoUrl: row.logo_url ?? undefined,
        flyerUrl: row.flyer_url ?? undefined,
        videoUrl: row.video_url ?? undefined,
        mediaGallery: parseMedia(row.media_gallery),
      };
    })
    .filter(isPubliclyListedHostShop);

  const all = [...applicationBacked, ...directoryBacked];

  if (program) {
    const slug = PROGRAM_SLUGS[program];
    return all.filter((shop) => matchesHostShopProgram(shop, slug));
  }
  return all;
}

/** Resolve an individual public profile back to the operationally approved Host Site. */
export async function getApprovedShopByPublicSlug(publicSlug: string): Promise<HostShop | null> {
  const shops = await getApprovedShops();
  const featured = getFeaturedHostPartnerBySlug(publicSlug);
  return shops.find((shop) => shop.publicSlug === publicSlug ||
    (featured && (getFeaturedHostPartnerBySlug(shop.publicSlug ?? '')?.slug === featured.slug ||
      businessKey(shop.name) === businessKey(featured.name) ||
      (featured.dba && businessKey(shop.name) === businessKey(featured.dba))))) ?? null;
}
