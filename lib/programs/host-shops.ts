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

function parseAddress(raw: string): { address: string; city: string; state: string; zip: string } {
  // Expected format: "123 Main St, City, ST 12345"
  const parts = raw.split(',').map((p) => p.trim());
  const stateZip = (parts[2] ?? '').split(' ').filter(Boolean);
  return {
    address: parts[0] ?? raw,
    city: parts[1] ?? '',
    state: stateZip[0] ?? 'IN',
    zip: stateZip[1] ?? '',
  };
}

export async function getApprovedShops(program?: ProgramKey): Promise<HostShop[]> {
  // Admin client requires SUPABASE_SERVICE_ROLE_KEY — injected from SSM
  // build time. Return empty list so static generation succeeds; ISR will
  // populate real data at runtime.
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

  // Normalise barber rows
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

  // Normalise host rows
  const hostShops: HostShop[] = (hostRows ?? []).map((s) => {
    const parsed = parseAddress(s.address ?? '');
    return {
      id: s.id,
      name: s.shop_name,
      ...parsed,
      phone: s.phone ?? '',
      email: s.email ?? '',
      supervisor: '',
      programs: (s.intake?.programs as string[]) ?? [PROGRAM_SLUGS.cosmetology],
      badge: 'partner',
    };
  });

  // Merge programs for shops present in both tables (matched by name)
  const barberNameMap = new Map(barberShops.map((s) => [s.name.toLowerCase(), s]));
  barberShops.forEach((bs) => {
    const match = hostShops.find((hs) => hs.name.toLowerCase() === bs.name.toLowerCase());
    if (match) bs.programs = [...new Set([...bs.programs, ...match.programs])];
  });

  // Host-only shops (not already in barber table)
  const hostOnly = hostShops.filter((s) => !barberNameMap.has(s.name.toLowerCase()));

  const all = [...barberShops, ...hostOnly];

  // Filter by exact program slug if requested
  if (program) {
    const slug = PROGRAM_SLUGS[program];
    return all.filter((s) => s.programs.includes(slug));
  }

  return all;
}
