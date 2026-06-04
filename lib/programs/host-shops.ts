/**
 * lib/programs/host-shops.ts
 *
 * Single source of truth for fetching and normalising approved host shops
 * from both barbershop_partner_applications (barber) and
 * host_shop_applications (cosmetology / multi-program).
 *
 * Used by:
 *   - app/api/programs/host-shops/route.ts  (public API)
 *   - app/programs/barber-apprenticeship/host-shops/page.tsx  (SSR page)
 *   - components/programs/HostShopSelect.tsx  (client dropdown via API)
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
} as const;

export type ProgramKey = keyof typeof PROGRAM_SLUGS;

/** Human-readable labels for program slugs on marketing pages */
export const PROGRAM_LABELS: Record<string, string> = {
  [PROGRAM_SLUGS.barber]: 'Barber Apprenticeship',
  [PROGRAM_SLUGS.cosmetology]: 'Cosmetology Apprenticeship',
  'nail-technician-apprenticeship': 'Nail Technician Apprenticeship',
  'esthetician-apprenticeship': 'Esthetician Apprenticeship',
};

export const ELEVATE_PRESTIGE_BARBER_INSTITUTE = 'Elevate Prestige Barber and Beauty Institute';
export const KOUNTRY_KUTZ_BARBERSHOP = 'Kountry Kutz Barbershop';

const BARBER_FALLBACK_SHOPS: HostShop[] = [
  {
    id: 'fallback-elevate-prestige',
    name: ELEVATE_PRESTIGE_BARBER_INSTITUTE,
    address: '6331 N Keystone Ave',
    city: 'Indianapolis',
    state: 'IN',
    zip: '46220',
    phone: '(317) 760-7908',
    email: 'elevate4humanityedu@gmail.com',
    supervisor: '',
    programs: [PROGRAM_SLUGS.barber, PROGRAM_SLUGS.cosmetology],
    badge: 'partner',
  },
  {
    id: 'fallback-kountry-kutz',
    name: KOUNTRY_KUTZ_BARBERSHOP,
    address: 'New Palestine area',
    city: 'New Palestine',
    state: 'IN',
    zip: '46163',
    phone: '',
    email: '',
    supervisor: '',
    programs: [PROGRAM_SLUGS.barber],
    badge: 'partner',
  },
];

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

/** Normalize shop names for deduplication (not for display). */
export function normalizeShopKey(name: string): string {
  const key = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b(l\.?l\.?c\.?|llc|inc|corp|co)\b/g, '')
    .replace(/[.,']/g, '')
    .trim();

  if (
    key.includes('prestige elevation') ||
    key.includes('prestige kountry') ||
    key.includes('elevate prestige')
  ) {
    return 'elevate prestige barber and beauty institute';
  }
  if (key.includes('kountry kutz')) {
    return 'kountry kutz barbershop';
  }
  if (key.includes("cal's kutz") || key.includes('cals kutz')) {
    return 'cals kutz studio';
  }
  if (key.includes('b-52') || key.includes('b52')) {
    return 'b-52s barber shop';
  }
  if (key.includes('style and scissor')) {
    return 'style and scissor salon';
  }

  return key;
}

function canonicalDisplayName(key: string, fallbackName: string): string {
  if (key === 'elevate prestige barber and beauty institute') {
    return ELEVATE_PRESTIGE_BARBER_INSTITUTE;
  }
  if (key === 'kountry kutz barbershop') {
    return KOUNTRY_KUTZ_BARBERSHOP;
  }
  return fallbackName.trim();
}

function pickRicherField(current: string, next: string): string {
  return next.trim().length > current.trim().length ? next : current;
}

function mergeShops(existing: HostShop, incoming: HostShop): HostShop {
  return {
    id: existing.id.startsWith('fallback-') ? incoming.id : existing.id,
    name: canonicalDisplayName(
      normalizeShopKey(existing.name),
      pickRicherField(existing.name, incoming.name),
    ),
    address: pickRicherField(existing.address, incoming.address),
    city: pickRicherField(existing.city, incoming.city),
    state: pickRicherField(existing.state || 'IN', incoming.state || 'IN'),
    zip: pickRicherField(existing.zip, incoming.zip),
    phone: pickRicherField(existing.phone, incoming.phone),
    email: pickRicherField(existing.email, incoming.email),
    supervisor: pickRicherField(existing.supervisor, incoming.supervisor),
    programs: [...new Set([...existing.programs, ...incoming.programs])],
    badge: existing.badge || incoming.badge,
  };
}

function dedupeShops(shops: HostShop[]): HostShop[] {
  const byKey = new Map<string, HostShop>();
  for (const shop of shops) {
    const key = normalizeShopKey(shop.name);
    const existing = byKey.get(key);
    if (existing) {
      byKey.set(key, mergeShops(existing, shop));
    } else {
      byKey.set(key, { ...shop, name: canonicalDisplayName(key, shop.name) });
    }
  }
  return [...byKey.values()].sort((a, b) => a.name.localeCompare(b.name));
}

function ensureBarberFallbacks(shops: HostShop[]): HostShop[] {
  const merged = dedupeShops(shops);
  const byKey = new Map(merged.map((s) => [normalizeShopKey(s.name), s]));

  for (const fallback of BARBER_FALLBACK_SHOPS) {
    const key = normalizeShopKey(fallback.name);
    const existing = byKey.get(key);
    if (existing) {
      byKey.set(key, mergeShops(existing, fallback));
    } else {
      byKey.set(key, { ...fallback });
    }
  }

  return [...byKey.values()]
    .filter((s) => s.programs.includes(PROGRAM_SLUGS.barber))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getApprovedShops(program?: ProgramKey): Promise<HostShop[]> {
  let db: Awaited<ReturnType<typeof requireAdminClient>>;
  try {
    db = await requireAdminClient();
  } catch {
    if (program === 'barber') {
      return ensureBarberFallbacks(BARBER_FALLBACK_SHOPS);
    }
    return [];
  }
  if (!db) {
    if (program === 'barber') {
      return ensureBarberFallbacks(BARBER_FALLBACK_SHOPS);
    }
    return [];
  }

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
    name: (s.shop_dba_name || s.shop_legal_name || '').trim(),
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
    const intakePrograms = (s.intake?.programs as string[] | undefined) ?? [];
    return {
      id: s.id,
      name: (s.shop_name ?? '').trim(),
      ...parsed,
      phone: s.phone ?? '',
      email: s.email ?? '',
      supervisor: '',
      programs:
        intakePrograms.length > 0 ? intakePrograms : [PROGRAM_SLUGS.cosmetology],
      badge: 'partner',
    };
  });

  const merged = dedupeShops([...barberShops, ...hostShops]);

  if (program === 'barber') {
    const slug = PROGRAM_SLUGS.barber;
    const barberFromDb = merged.filter((s) => s.programs.includes(slug));
    return ensureBarberFallbacks(barberFromDb);
  }

  if (program) {
    const slug = PROGRAM_SLUGS[program];
    return merged.filter((s) => s.programs.includes(slug));
  }

  return merged;
}
