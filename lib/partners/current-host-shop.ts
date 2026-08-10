import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { HOST_SHOP_ROLES, hasAnyRole, normalizeRoles } from '@/lib/rbac/role-matrix';

export type CurrentHostShopPartner = {
  id: string;
  name: string;
  dba?: string | null;
  contact_email?: string | null;
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
  status?: string | null;
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

/**
 * Resolve the signed-in Host Shop user to exactly one active partner record.
 * Platform admins are intentionally not auto-scoped here; admin previews use
 * the explicit partnerId selector on the Host Shop board instead.
 */
export async function requireCurrentHostShopPartner() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error('HOST_SHOP_UNAUTHENTICATED');

  const db = await requireAdminClient();
  const [{ data: profile }, { data: roleRows }] = await Promise.all([
    db.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    db.from('user_roles').select('roles(name)').eq('user_id', user.id),
  ]);

  const secondaryRoles = (roleRows ?? [])
    .map((row: any) => row?.roles?.name)
    .filter((value: unknown): value is string => typeof value === 'string');
  const effectiveRoles = normalizeRoles([profile?.role, ...secondaryRoles]);

  if (!hasAnyRole(effectiveRoles, HOST_SHOP_ROLES, { adminOverride: false })) {
    throw new Error('HOST_SHOP_FORBIDDEN');
  }

  const { data: link, error: linkError } = await db
    .from('partner_users')
    .select(
      'partner_id, status, partners(id, name, dba, contact_email, phone, website, website_url, address_line1, address_line2, city, state, zip, partner_type, program_type, programs, approval_status, status, mou_signed, mou_signed_at, mou_version, onboarding_completed, onboarding_step, documents_verified, supervisor_name, supervisor_license_number, supervisor_years_licensed, compensation_model, workers_comp_status, has_general_liability, can_supervise_and_verify)',
    )
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (linkError || !link?.partner_id || !link.partners) {
    throw new Error('HOST_SHOP_PARTNER_NOT_FOUND');
  }

  return {
    user,
    db,
    effectiveRoles,
    partner: link.partners as unknown as CurrentHostShopPartner,
  };
}
