/**
 * Canonical Host Shop Dashboard entry point.
 */
import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  getHostShopOnboardingPaths,
  resolveHostShopProgram,
} from '@/lib/partners/host-shop-onboarding';
import { provisionPartnerFromBarberApplication } from '@/lib/partners/provision-barber-partner';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Host Shop Dashboard | Elevate for Humanity',
  description: 'Manage approved host-shop apprentices and training records.',
  robots: { index: false, follow: false },
};

export default async function HostShopDashboardPage() {
  const { user, effectiveRoles } = await requireRole(HOST_SHOP_ROLES);
  const db = await requireAdminClient();

  const isPlatformAdmin = effectiveRoles.some((role) =>
    ['super_admin', 'admin', 'org_admin'].includes(role),
  );
  if (isPlatformAdmin) redirect('/host-shop/dashboard/board');

  const { data: partnerLink } = await db
    .from('partner_users')
    .select(
      'partner_id, status, partners(id, partner_type, program_type, programs, approval_status, status, onboarding_completed, mou_signed, documents_verified)',
    )
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  let partner = partnerLink?.partners as unknown as {
    id: string;
    partner_type: string | null;
    program_type?: string | null;
    programs?: string[] | null;
    approval_status: string | null;
    status: string | null;
    onboarding_completed: boolean | null;
    mou_signed: boolean | null;
    documents_verified: boolean | null;
  } | null;

  if (!partner) {
    const { data: legacyApplication } = user.email
      ? await db
          .from('barbershop_partner_applications')
          .select(
            'id, shop_legal_name, shop_dba_name, owner_name, contact_name, contact_email, contact_phone, shop_address_line1, shop_address_line2, shop_city, shop_state, shop_zip, indiana_shop_license_number, supervisor_name, supervisor_license_number, supervisor_years_licensed, compensation_model, workers_comp_status, can_supervise_and_verify, mou_signed_at, mou_signature_data, status',
          )
          .eq('contact_email', user.email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

    if (legacyApplication?.status === 'approved') {
      const provisioned = await provisionPartnerFromBarberApplication(db, legacyApplication, {
        linkUserId: user.id,
      });
      if (!provisioned) redirect('/host-shop/login?error=provisioning');

      const { data: provisionedPartner } = await db
        .from('partners')
        .select(
          'id, partner_type, program_type, programs, approval_status, status, onboarding_completed, mou_signed, documents_verified',
        )
        .eq('id', provisioned.partnerId)
        .maybeSingle();
      partner = provisionedPartner as typeof partner;
    } else if (
      legacyApplication?.status === 'pending' ||
      legacyApplication?.status === 'submitted'
    ) {
      redirect('/host-shop/login?status=pending');
    } else {
      redirect('/host-shop/login?error=no_partner');
    }
  }

  if (!partner) redirect('/host-shop/login?error=no_partner');
  if (partner.approval_status !== 'approved' || partner.status !== 'active') {
    redirect('/host-shop/onboarding');
  }

  const programType = resolveHostShopProgram(partner as unknown as Record<string, unknown>);
  const onboardingPaths = getHostShopOnboardingPaths(programType);
  if (!partner.mou_signed) redirect(onboardingPaths.signMou);
  if (!partner.onboarding_completed) redirect(onboardingPaths.forms);

  redirect('/host-shop/dashboard/board');
}
