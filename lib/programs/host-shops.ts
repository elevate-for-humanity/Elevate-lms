/**
 * lib/programs/host-shops.ts
 *
 * Single source of truth for fetching and normalising approved host shops
 * from both barbershop_partner_applications and host_shop_applications.
 *
 * Public pages, APIs, and selectors should consume this helper instead of
 * rebuilding host-site lists independently.
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
  /** Canonical program slugs this shop is approved for */
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
  const parts = raw.split(',').map((p) => p.trim());
  const stateZip = (parts[2] ?? '').split(' ').filter(Boolean);
  return {
    address: parts[0] ?? raw,
    city: parts[1] ?? '',
    state: stateZip[0] ?? 'IN',
    zip: stateZip[1] ?? '',
  };
}

function isPubliclyListedHostShop(shop: HostShop): boolean {
  const name = shop.name.toLowerCase();
  return !name.includes('prestige');
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
      .select(
        'id, shop_legal_name, shop_dba_name, shop_address_line1, shop_city, shop_state, shop_zip, contact_phone, contact_email, supervisor_name',
      )
      .eq('status', 'approved')
      .order('shop_legal_name'),
    db
      .from('host_shop_applications')
      .select('id, shop_name, address, phone, email, intake')
      .eq('status', 'approved')
      .order('shop_name'),
  ]);

  const barberShops: HostShop[] = (barberRows ?? []).map((s) => ({
    id: s.id,
    name: s.shop_dba_name || s.shop_legal_name,
    address: s.shop_address_line1 ?? '',
    city: s.shop_city ?? '',
    state: s.shop_state ?? 'IN',
    zip: s.shop_zip ?? '',
    phone: s.contact_phone ?? '',
    email: s.contact_email ?? '',
    supervisor: s.supervisor_name ?? '',
    programs: [PROGRAM_SLUGS.barber],
    badge: 'partner',
  }));

  const hostShops: HostShop[] = (hostRows ?? []).map((s) => {
    const parsed = parseAddress(s.address ?? '');
    const rawPrograms = Array.isArray(s.intake?.programs) ? s.intake.programs : [];
    const programs = rawPrograms
      .map(normalizeProgram)
      .filter((value): value is string => Boolean(value));

    return {
      id: s.id,
      name: s.shop_name,
      ...parsed,
      phone: s.phone ?? '',
      email: s.email ?? '',
      supervisor: '',
      programs: programs.length ? [...new Set(programs)] : [PROGRAM_SLUGS.cosmetology],
      badge: 'partner',
    };
  });

  const barberNameMap = new Map(barberShops.map((s) => [s.name.toLowerCase(), s]));
  barberShops.forEach((bs) => {
    const match = hostShops.find((hs) => hs.name.toLowerCase() === bs.name.toLowerCase());
    if (match) bs.programs = [...new Set([...bs.programs, ...match.programs])];
  });

  const hostOnly = hostShops.filter((s) => !barberNameMap.has(s.name.toLowerCase()));
  const all = [...barberShops, ...hostOnly].filter(isPubliclyListedHostShop);

  if (program) {
    const slug = PROGRAM_SLUGS[program];
    return all.filter((s) => s.programs.includes(slug));
  }

  return all;
}
