/**
 * Canonical approved Host Shop loader.
 * Operational approval remains authoritative; public partner profiles only enrich
 * approved records with promotional media, website, and source-verified public contact data.
 */

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

export const PROGRAM_SLUGS = {
  barber: 'barber-apprenticeship',
  cosmetology: 'cosmetology-apprenticeship',
  esthetician: 'esthetician-apprenticeship',
  nail: 'nail-technician-apprenticeship',
} as const;

export type ProgramKey = keyof typeof PROGRAM_SLUGS;

export const PROGRAM_LABELS: Record<string, string> = {
  [PROGRAM_SLUGS.barber]: 'Barber Apprenticeship',
  [PROGRAM_SLUGS.cosmetology]: 'Cosmetology Apprenticeship',
  [PROGRAM_SLUGS.esthetician]: 'Esthetician Apprenticeship',
  [PROGRAM_SLUGS.nail]: 'Nail Technician Apprenticeship',
};

const PROGRAM_ALIASES: Record<string, string> = {
  barber: PROGRAM_SLUGS.barber,
  cosmetology: PROGRAM_SLUGS.cosmetology,
  esthetician: PROGRAM_SLUGS.esthetician,
  esthetics: PROGRAM_SLUGS.esthetician,
  nail: PROGRAM_SLUGS.nail,
  nails: PROGRAM_SLUGS.nail,
  'nail-technician': PROGRAM_SLUGS.nail,
  ...Object.fromEntries(Object.values(PROGRAM_SLUGS).map((slug) => [slug, slug])),
};

function normalizeProgram(value: unknown): string | null {
  const normalized = String(value ?? '').trim().toLowerCase();
  return PROGRAM_ALIASES[normalized] ?? null;
}

function parseAddress(raw: string): { address: string; city: string; state: string; zip: string } {
  const parts = raw.split(',').map((part) => part.trim()).filter(Boolean);
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
  return !shop.name.toLowerCase().includes('prestige');
}

function approvedAddress(shop: HostShop) {
  return [shop.address, shop.city, shop.state, shop.zip].filter(Boolean).join(', ');
}

function approvedMapsUrl(shop: HostShop) {
  const value = approvedAddress(shop);
  return value ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shop.name} ${value}`)}` : undefined;
}

function approvedDescription(shop: HostShop) {
  const programNames = shop.programs.map((slug) => PROGRAM_LABELS[slug] ?? slug);
  const location = [shop.city, shop.state].filter(Boolean).join(', ');
  const pathways = programNames.length === 1 ? programNames[0] : programNames.join(' and ');
  return `${shop.name}${location ? ` — ${location}` : ''}. Approved Elevate Host Site record for ${pathways}.`;
}

export async function getApprovedShops(program?: ProgramKey): Promise<HostShop[]> {
  let db: Awaited<ReturnType<typeof requireAdminClient>>;
  try {
    db = await requireAdminClient();
  } catch {
    return [];
  }

  const [{ data: barberRows }, { data: hostRows }, { data: publicRows }] = await Promise.all([
    db
      .from('barbershop_partner_applications')
      .select('id, shop_legal_name, shop_dba_name, shop_address_line1, shop_city, shop_state, shop_zip, contact_phone, contact_email, supervisor_name')
      .eq('status', 'approved')
      .order('shop_legal_name'),
    db
      .from('host_shop_applications')
      .select('id, shop_name, address, phone, email, intake, approved_by')
      .eq('status', 'approved')
      .neq('approved_by', 'system_verification')
      .order('shop_name'),
    db
      .from('public_host_shops')
      .select('public_slug, display_name, description, logo_url, flyer_url, website_url, website, phone, address_line1, city, state, zip, media_gallery, video_url, source_url'),
  ]);

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
    const programs = rawPrograms.map(normalizeProgram).filter((value): value is string => typeof value === 'string');
    return {
      id: shop.id,
      name: shop.shop_name,
      ...parsed,
      phone: shop.phone ?? '',
      email: shop.email ?? '',
      supervisor: '',
      programs: programs.length ? [...new Set(programs)] : [PROGRAM_SLUGS.cosmetology],
      badge: 'partner',
    };
  });

  const barberNameMap = new Map(barberShops.map((shop) => [businessKey(shop.name), shop]));
  barberShops.forEach((barberShop) => {
    const match = hostShops.find((hostShop) => businessKey(hostShop.name) === businessKey(barberShop.name));
    if (match) barberShop.programs = [...new Set([...barberShop.programs, ...match.programs])];
  });

  const all = [...barberShops, ...hostShops.filter((shop) => !barberNameMap.has(businessKey(shop.name)))]
    .filter(isPubliclyListedHostShop)
    .map((shop) => {
      const profile = (publicRows ?? []).find((row) => {
        const phoneMatch = digits(shop.phone) && digits(shop.phone) === digits(row.phone);
        const addressMatch = businessKey(shop.address) && businessKey(shop.address) === businessKey(row.address_line1) && businessKey(shop.city) === businessKey(row.city);
        const nameMatch = businessKey(shop.name) && businessKey(shop.name) === businessKey(row.display_name);
        return Boolean(phoneMatch || addressMatch || nameMatch);
      });

      const sourceVerifiedPublicPhone = profile?.phone && (profile.source_url || profile.website_url || profile.website)
        ? profile.phone
        : shop.phone;
      const enriched: HostShop = {
        ...shop,
        phone: sourceVerifiedPublicPhone || shop.phone,
        publicSlug: profile?.public_slug ?? undefined,
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

  if (program) {
    const slug = PROGRAM_SLUGS[program];
    return all.filter((shop) => shop.programs.includes(slug));
  }
  return all;
}

/** Resolve an individual public profile back to the operationally approved Host Site. */
export async function getApprovedShopByPublicSlug(publicSlug: string): Promise<HostShop | null> {
  const shops = await getApprovedShops();
  return shops.find((shop) => shop.publicSlug === publicSlug) ?? null;
}
