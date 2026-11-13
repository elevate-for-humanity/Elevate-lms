import 'server-only';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { HOST_SHOP_ADMIN_COOKIE } from '@/lib/partner/board';
import { normalizeRoles } from '@/lib/rbac/role-matrix';
import { resolveHostShopAdminPreview } from '@/lib/admin/host-shop-preview';
import { enforceArchivedHostShopScope } from '@/lib/auth/require-role';

export type CurrentHostShopPartner = {
  id: string;
  partner_application_id?: string | null;
  name: string;
  dba?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  phone?: string | null;
  website?: string | null;
  website_url?: string | null;
  address_line1?: string | null;
  address_line2?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  partner_type?: string | null;
  program_type?: string | null;
  programs?: unknown;
  approval_status?: string | null;
  account_status?: string | null;
  status?: string | null;
  is_active?: boolean | null;
  mou_signed?: boolean | null;
  mou_signed_at?: string | null;
  mou_version?: string | null;
  onboarding_completed?: boolean | null;
  onboarding_step?: string | null;
  documents_verified?: boolean | null;
  supervisor_name?: string | null;
  supervisor_license_number?: string | null;
  supervisor_years_licensed?: number | null;
  compensation_model?: string | null;
  workers_comp_status?: string | null;
  has_general_liability?: boolean | null;
  can_supervise_and_verify?: boolean | null;
};

const PARTNER_SELECT =
  'id, partner_application_id, name, dba, contact_email, contact_phone, phone, website, website_url, address_line1, address_line2, city, state, zip, partner_type, program_type, programs, approval_status, account_status, status, is_active, mou_signed, mou_signed_at, mou_version, onboarding_completed, onboarding_step, documents_verified, supervisor_name, supervisor_license_number, supervisor_years_licensed, compensation_model, workers_comp_status, has_general_liability, can_supervise_and_verify';

/**
 * Resolve the signed-in Host Shop context once for every Host Shop surface.
 * Normal partner users resolve through partner_users. Platform admins resolve
 * only through the explicit short-lived tenant selector used by the Host Shop
 * board, so admin access never mutates partner membership.
 */
export async function requireCurrentHostShopPartner(
  options: { allowPendingOnboarding?: boolean } = {},
) {
  const supabase = await createClient();
  const {
    data: { user: sessionUser },
    error: authError,
  } = await supabase.auth.getUser();
  const handoff = await resolveHostShopAdminPreview();
  // The existing signed, short-lived Admin handoff is also the authority for
  // document APIs when the LMS subdomain has no Supabase session. Never borrow
  // a handoff belonging to a different authenticated account.
  const preview = handoff && (!sessionUser || sessionUser.id === handoff.actorId) ? handoff : null;
  const user = sessionUser || (preview ? { id: preview.actorId, email: preview.actorEmail } : null);
  if ((!preview && authError) || !user) throw new Error('HOST_SHOP_UNAUTHENTICATED');

  const db = await requireAdminClient();
  const [{ data: profile, error: profileError }, { data: roleRows, error: roleError }] = await Promise.all([
    db.from('profiles').select('role,is_active,suspended').eq('id', user.id).maybeSingle(),
    db.from('user_roles').select('roles(name)').eq('user_id', user.id),
  ]);
  if (profileError || roleError || !profile || profile.is_active === false || profile.suspended === true)
    throw new Error('HOST_SHOP_UNAUTHENTICATED');

  const secondaryRoles = (roleRows ?? [])
    .map((row: any) => row?.roles?.name)
    .filter((value: unknown): value is string => typeof value === 'string');
  const effectiveRoles = await enforceArchivedHostShopScope(
    user.id, profile.role, normalizeRoles([profile.role, ...secondaryRoles]),
  );

  const isPlatformAdmin = effectiveRoles.some((role) =>
    ['super_admin', 'admin'].includes(role),
  );

  if (isPlatformAdmin) {
    const cookieStore = await cookies();
    const selectedPartnerId =
      preview?.actorId === user.id
        ? preview.partnerId
        : cookieStore.get(HOST_SHOP_ADMIN_COOKIE)?.value;
    if (!selectedPartnerId) throw new Error('HOST_SHOP_ADMIN_PARTNER_REQUIRED');

    const { data: partner, error: partnerError } = await db
      .from('partners')
      .select(PARTNER_SELECT)
      .eq('id', selectedPartnerId)
      .maybeSingle();

    if (partnerError || !partner) throw new Error('HOST_SHOP_ADMIN_PARTNER_REQUIRED');
    return {
      user,
      db,
      effectiveRoles,
      partner: partner as CurrentHostShopPartner,
      isPlatformAdmin: true,
    };
  }

  const { data: link, error: linkError } = await db
    .from('partner_users')
    .select('partner_id, status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (linkError) throw new Error('HOST_SHOP_PARTNER_NOT_FOUND');

  let partnerId = link?.partner_id as string | null | undefined;
  if (!partnerId) {
    const { data: staffLink, error: staffError } = await db
      .from('shop_staff')
      .select('shop_id, active, shops!inner(partner_id, active)')
      .eq('user_id', user.id)
      .eq('active', true)
      .eq('shops.active', true)
      .limit(1)
      .maybeSingle();

    if (staffError) throw new Error('HOST_SHOP_PARTNER_NOT_FOUND');
    const shop = staffLink?.shops as unknown as { partner_id?: string | null } | null;
    partnerId = shop?.partner_id;
  }

  if (!partnerId) throw new Error('HOST_SHOP_PARTNER_NOT_FOUND');

  const { data: partner, error: partnerError } = await db
    .from('partners')
    .select(PARTNER_SELECT)
    .eq('id', partnerId)
    .eq('status', 'active')
    .maybeSingle();

  if (partnerError || !partner || partner.is_active === false) {
    throw new Error('HOST_SHOP_PARTNER_NOT_FOUND');
  }

  // Only document onboarding may admit a linked pending partner with conditional access.
  // Operational Host Shop routes still require full approval.
  const fullyApproved = partner.approval_status === 'approved';
  const conditionalOnboarding =
    options.allowPendingOnboarding === true &&
    partner.approval_status === 'pending' &&
    partner.account_status === 'conditional_access';
  if (!fullyApproved && !conditionalOnboarding) {
    throw new Error('HOST_SHOP_PARTNER_NOT_FOUND');
  }

  return {
    user,
    db,
    effectiveRoles,
    partner: partner as CurrentHostShopPartner,
    isPlatformAdmin: false,
  };
}
