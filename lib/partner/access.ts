import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type PartnerRole =
  | 'owner'
  | 'partner_admin'
  | 'site_coordinator'
  | 'staff'
  | 'instructor'
  | 'manager'
  | 'mentor'
  | 'supervisor'
  | 'admin';

const HOST_SHOP_ADMIN_COOKIE = '__efh_host_shop_partner';

export async function getSessionUser() {
  const supabase = await createClient();
  const { data, error }: any = await supabase.auth.getUser();
  if (error) return null;
  return data.user ?? null;
}

export async function getMyPartnerContext() {
  const supabase = await createClient();
  const user = await getSessionUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();

  const profileRole = (profile?.role ?? null) as string | null;

  // Active relationships grant Host Shop access even when a legacy profile role
  // has not yet been synchronized. The relationship tables remain authoritative.
  const { data: staffRows } = await supabase
    .from('shop_staff')
    .select('shop_id, role, active, shops:shops!inner(id, name, active, partner_id)')
    .eq('user_id', user.id)
    .eq('active', true)
    .eq('shops.active', true);

  if (staffRows?.length) {
    return {
      user,
      profileRole,
      shops: staffRows.map((row: any) => ({
        shop_id: row.shop_id,
        staff_role: (row.role || 'staff') as PartnerRole,
        shop: row.shops,
      })),
    };
  }

  // Host-shop members are commonly linked through partner_users rather than shop_staff.
  // Do not assume a user can only have one historical/active partner relationship.
  const { data: partnerUsers } = await supabase
    .from('partner_users')
    .select('partner_id, role, status, created_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  const partnerUser = (partnerUsers || []).find((row: any) => Boolean(row?.partner_id));
  let partnerId = partnerUser?.partner_id as string | undefined;
  let partnerRole = (partnerUser?.role || 'owner') as PartnerRole;

  // Platform admins may inspect a tenant selected from the Host Shop board.
  if (!partnerId && ['admin', 'super_admin', 'org_admin'].includes(profileRole || '')) {
    const cookieStore = await cookies();
    partnerId = cookieStore.get(HOST_SHOP_ADMIN_COOKIE)?.value;
    partnerRole = 'admin';
  }

  if (!partnerId) return null;

  const { data: partner } = await supabase
    .from('partners')
    .select('id, status, approval_status, is_active')
    .eq('id', partnerId)
    .maybeSingle();

  if (
    !partner ||
    partner.status !== 'active' ||
    partner.approval_status !== 'approved' ||
    partner.is_active === false
  ) {
    return null;
  }

  const { data: partnerShops } = await supabase
    .from('shops')
    .select('id, name, active, partner_id')
    .eq('partner_id', partnerId)
    .eq('active', true);

  if (!partnerShops?.length) return null;

  return {
    user,
    profileRole,
    shops: partnerShops.map((shop: any) => ({
      shop_id: shop.id,
      staff_role: partnerRole,
      shop,
    })),
  };
}
