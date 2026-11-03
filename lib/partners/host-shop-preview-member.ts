type ShopMember = { user_id: string | null; role?: string | null };

// Callers supply active members in created_at, user_id order for stable ties.
export function hostShopPreviewMemberId(members: ShopMember[] | null): string | null {
  const active = (members || []).filter(member => Boolean(member.user_id));
  for (const role of ['owner', 'partner_admin', 'admin']) {
    const member = active.find(member => member.role?.trim().toLowerCase() === role);
    if (member?.user_id) return member.user_id;
  }
  return active[0]?.user_id || null;
}
