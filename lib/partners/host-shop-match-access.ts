/**
 * Match-request program scope is the approved Host Shop's explicit assignments,
 * not every program on an apprentice application or in the whole school.
 * Call only after authenticated host membership has been checked.
 */
export async function permittedHostShopProgramSlugs(db: any, userId: string): Promise<string[]> {
  const { data: memberships, error: membershipError } = await db
    .from('partner_users')
    .select('partner_id,role')
    .eq('user_id', userId)
    .eq('status', 'active');
  if (membershipError) throw new Error('HOST_SHOP_PROGRAM_MEMBERSHIP_UNAVAILABLE');
  const partnerIds = Array.from(new Set(
    (memberships || []).filter((membership: any) =>
      ['owner', 'partner_admin', 'admin', 'supervisor', 'mentor', 'manager'].includes(
        String(membership.role || '').toLowerCase(),
      )).map((membership: any) => membership.partner_id).filter(Boolean),
  )) as string[];
  if (!partnerIds.length) return [];
  const { data: partners, error: partnerError } = await db
    .from('partners')
    .select('id,programs,status,approval_status')
    .in('id', partnerIds)
    .eq('status', 'active')
    .eq('approval_status', 'approved');
  if (partnerError) throw new Error('HOST_SHOP_PROGRAM_ASSIGNMENTS_UNAVAILABLE');
  return Array.from(new Set((partners || []).flatMap((partner: any) =>
    Array.isArray(partner.programs)
      ? partner.programs.filter((value: unknown): value is string =>
          typeof value === 'string' && value.length > 0)
      : [],
  )));
}
