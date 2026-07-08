import { createClient } from '@/lib/supabase/server';

export type PartnerRole =
  | 'owner'
  | 'site_coordinator'
  | 'staff'
  | 'instructor'
  | 'manager'
  | 'supervisor'
  | 'admin';

export async function getSessionUser() {
  const supabase = await createClient();
  const { data, error }: any = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

// Roles allowed to access the partner portal
const PARTNER_ROLES = new Set(['partner', 'admin', 'super_admin']);

export async function getMyPartnerContext() {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return null;

  // Enforce profile role — only partner/admin roles can access partner portal
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();

  const profileRole = (profile?.role ?? null) as string | null;
  if (!profileRole || !PARTNER_ROLES.has(profileRole)) return null;

  // Shops the user belongs to — only active shops
  // Try with shop_staff.active filter first; fall back if column doesn't exist yet
  let shops: any[] | null = null;
  const { data: s1, error: e1 } = await supabase
    .from('shop_staff')
    .select('shop_id, role, active, shops:shops!inner(id, name, active)')
    .eq('user_id', user.id)
    .eq('active', true)
    .eq('shops.active', true);

  if (!e1) {
    shops = s1;
  } else {
    // Fallback: shop_staff.active column not yet added
    const { data: s2 } = await supabase
      .from('shop_staff')
      .select('shop_id, role, shops:shops!inner(id, name, active)')
      .eq('user_id', user.id)
      .eq('shops.active', true);
    shops = s2;
  }

  if (!shops?.length) return null;

  return {
    user,
    profileRole,
    shops: shops.map((s: any) => ({
      shop_id: s.shop_id,
      staff_role: s.role as PartnerRole,
      shop: s.shops,
    })),
  };
}
