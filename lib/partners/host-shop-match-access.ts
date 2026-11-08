/**
 * Host Shop permissions are the intersection of an active partner membership,
 * approved and active partner, active shop, and that exact partner's programs.
 * A user who belongs to two shops must never inherit one shop's program
 * permission when viewing a request addressed to the other shop.
 */
export type AuthorizedHostShopScope = {
  shopId: string;
  partnerId: string;
  programSlugs: string[];
};

const HOST_MEMBER_ROLES = new Set(['owner', 'partner_admin', 'admin', 'supervisor', 'mentor', 'manager']);

/** Map only known legacy partner labels; never infer from a generic salon type. */
export function canonicalHostShopProgram(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const slug = value.trim().toLowerCase().replace(/[\s_]+/g, '-');
  const legacy: Record<string, string> = {
    barber: 'barber-apprenticeship',
    cosmetology: 'cosmetology-apprenticeship',
    esthetician: 'esthetician-apprenticeship',
    esthetics: 'esthetician-apprenticeship',
    'nail-tech': 'nail-technician-apprenticeship',
    'nail-technician': 'nail-technician-apprenticeship',
  };
  const normalized = legacy[slug] || slug;
  // No free-form SQL/filter syntax is ever accepted into PostgREST or().
  return /^[a-z0-9]+(?:-[a-z0-9]+)*-apprenticeship$/.test(normalized)
    ? normalized : null;
}

export function canonicalHostShopPrograms(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map(canonicalHostShopProgram).filter((slug): slug is string => Boolean(slug)))];
}

async function approvedPartnerPrograms(db: any, userId: string): Promise<Map<string, string[]>> {
  const { data: memberships, error: membershipError } = await db
    .from('partner_users')
    .select('partner_id,role')
    .eq('user_id', userId)
    .eq('status', 'active');
  if (membershipError) throw new Error('HOST_SHOP_PROGRAM_MEMBERSHIP_UNAVAILABLE');
  const partnerIds = [...new Set((memberships || [])
    .filter((membership: any) => HOST_MEMBER_ROLES.has(String(membership.role || '').toLowerCase()))
    .map((membership: any) => membership.partner_id)
    .filter(Boolean))] as string[];
  if (!partnerIds.length) return new Map();

  const { data: partners, error: partnerError } = await db
    .from('partners')
    .select('id,programs,status,approval_status,is_active')
    .in('id', partnerIds)
    .eq('status', 'active')
    .eq('approval_status', 'approved')
    .neq('is_active', false);
  if (partnerError) throw new Error('HOST_SHOP_PROGRAM_ASSIGNMENTS_UNAVAILABLE');

  const programsByPartner = new Map<string, string[]>();
  for (const partner of partners || []) {
    if (!partner?.id) continue;
    const programs = canonicalHostShopPrograms(partner.programs);
    if (programs.length) programsByPartner.set(partner.id, programs);
  }
  return programsByPartner;
}

/** Kept for callers that need a union for labels, never use its union to authorize a shop/request pair. */
export async function permittedHostShopProgramSlugs(db: any, userId: string): Promise<string[]> {
  const programsByPartner = await approvedPartnerPrograms(db, userId);
  return [...new Set([...programsByPartner.values()].flat())];
}

/** Authorizes the shop AND program together; no cross-partner union. */
export async function permittedHostShopProgramScopes(db: any, userId: string): Promise<AuthorizedHostShopScope[]> {
  const programsByPartner = await approvedPartnerPrograms(db, userId);
  if (!programsByPartner.size) return [];
  const { data: shops, error: shopError } = await db.from('shops')
    .select('id,partner_id,active')
    .in('partner_id', [...programsByPartner.keys()])
    .eq('active', true);
  if (shopError) throw new Error('HOST_SHOP_ACTIVE_SHOPS_UNAVAILABLE');
  return (shops || []).flatMap((shop: any) => {
    const programs = programsByPartner.get(shop.partner_id) || [];
    return shop.id && programs.length
      ? [{ shopId: String(shop.id), partnerId: String(shop.partner_id), programSlugs: programs }]
      : [];
  });
}

export function hostShopScopeAllowsRequest(
  scopes: AuthorizedHostShopScope[],
  shopId: unknown,
  programSlug: unknown,
): boolean {
  const program = canonicalHostShopProgram(programSlug);
  return Boolean(program && scopes.some(scope =>
    scope.shopId === shopId && scope.programSlugs.includes(program)));
}

/**
 * Supabase/PostgREST OR of AND clauses, applied *before* pagination/count.
 * All values come from UUID database keys and strictly validated canonical
 * program slugs; reject anything not safe for PostgREST filter syntax.
 */
export function hostShopMatchScopeFilter(scopes: AuthorizedHostShopScope[]): string {
  const validUuid = /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i;
  const clauses = new Set<string>();
  for (const scope of scopes) {
    if (!validUuid.test(scope.shopId)) continue;
    for (const program of scope.programSlugs) {
      const slug = canonicalHostShopProgram(program);
      if (!slug) continue;
      clauses.add(`and(host_shop_id.eq.${scope.shopId},program_slug.eq.${slug})`);
    }
  }
  return [...clauses].join(',');
}
