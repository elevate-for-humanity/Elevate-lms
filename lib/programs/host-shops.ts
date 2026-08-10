/**
 * Single source of truth for fetching and normalising approved host shops.
 */

import { requireAdminClient } from '@/lib/supabase/admin';

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
  const key = String(value ?? '').trim().toLowerCase();
  return PROGRAM_ALIASES[key] ?? null;
}

function parseAddress(raw: string): { address: string; city: string; state: string; zip: string } {
  const parts = raw.split(',').map((part) => part.trim());
  const stateZip = (parts[2] ?? '').split(' ').filter(Boolean);
  return {
    address: parts[0] ?? raw,
    city: parts[1] ?? '',
    state: stateZip[0] ?? 'IN',
    zip: stateZip[1] ?? '',
  };
}

function isPubliclyListedHostShop(shop: HostShop): boolean {
  return !shop.name.toLowerCase().includes('prestige');
}

export async function getApprovedShops(program?: ProgramKey): Promise<HostShop[]> {
  let db: Awaited<ReturnType<typeof requireAdminClient>>;
  try {
    db = await requireAdminClient();
  } catch {
    return [];
  }
  if (!db) return [];

  const [{ data: barberRows }, { data: hostRows }] = await Promise.all([
    db
      .from('barbershop_partner_applications')
      .select('id, shop_legal_name, shop_dba_name, shop_address_line1, shop_city, shop_state, shop_zip, contact_phone, contact_email, supervisor_name')
      .eq('status', 'approved')
      .order('shop_legal_name'),
    db
      .from('host_shop_applications')
      .select('id, shop_name, address, phone, email, intake')
      .eq('status', 'approved')
      .order('shop_name'),
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
    const programs: string[] = rawPrograms
      .map(normalizeProgram)
      .filter((value): value is string => typeof value === 'string');

    return {
      id: shop.id,
      name: shop.shop_name,
      ...parsed,
      phone: shop.phone ?? '',
      email: shop.email ?? '',
      supervisor: '',
      programs: programs.length ? [...new Set<string>(programs)] : [PROGRAM_SLUGS.cosmetology],
      badge: 'partner',
    };
  });

  const barberNameMap = new Map(barberShops.map((shop) => [shop.name.toLowerCase(), shop]));
  barberShops.forEach((barberShop) => {
    const match = hostShops.find((hostShop) => hostShop.name.toLowerCase() === barberShop.name.toLowerCase());
    if (match) barberShop.programs = [...new Set<string>([...barberShop.programs, ...match.programs])];
  });

  const hostOnly = hostShops.filter((shop) => !barberNameMap.has(shop.name.toLowerCase()));
  const all = [...barberShops, ...hostOnly].filter(isPubliclyListedHostShop);

  if (program) {
    const slug = PROGRAM_SLUGS[program];
    return all.filter((shop) => shop.programs.includes(slug));
  }

  return all;
}
