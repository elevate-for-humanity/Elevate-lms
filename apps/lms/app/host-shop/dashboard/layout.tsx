import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getMyPartnerContext, getSessionUser } from '@/lib/partner/access';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { getHostShopOnboardingPaths, resolveHostShopProgram } from '@/lib/partners/host-shop-onboarding';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';

export const dynamic = 'force-dynamic';

/**
 * Single authorization + readiness boundary for every /host-shop/dashboard/* route.
 * A canonical Host Shop role and a valid Host Shop relationship are required.
 * Operational access remains locked until MOU, onboarding, and required document
 * verification are complete.
 */
export default async function HostShopDashboardLayout({ children }: { children: React.ReactNode }) {
  // Relationship data alone is not permission to enter the Host Shop portal.
  // Apprentices can legitimately have an active placement at a shop, so enforce
  // the canonical role taxonomy before resolving partner/shop context.
  await requireRole(HOST_SHOP_ROLES);

  const context = await getMyPartnerContext();

  if (!context) {
    const user = await getSessionUser();
    if (!user) redirect('/host-shop/login?redirect=/host-shop/dashboard');
    redirect('/host-shop/login?error=no_partner');
  }

  const partnerId = context.shops.find((row) => row.shop?.partner_id)?.shop?.partner_id;
  if (!partnerId) redirect('/host-shop/orientation?error=no_partner');

  const db = await requireAdminClient();
  const { data: partner } = await db
    .from('partners')
    .select('id,partner_type,program_type,programs,onboarding_completed,mou_signed,documents_verified,status,approval_status,is_active')
    .eq('id', partnerId)
    .maybeSingle();

  if (!partner || partner.status !== 'active' || partner.approval_status !== 'approved' || partner.is_active === false) {
    redirect('/host-shop/login?error=no_partner');
  }

  const programType = resolveHostShopProgram(partner as unknown as Record<string, unknown>);
  const onboardingPaths = getHostShopOnboardingPaths(programType);

  if (!partner.mou_signed) {
    redirect(onboardingPaths.signMou);
  }
  if (!partner.onboarding_completed) {
    redirect(onboardingPaths.forms);
  }
  if (!partner.documents_verified) {
    redirect(onboardingPaths.documents);
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, first_name, last_name, avatar_url')
    .eq('id', context.user.id)
    .maybeSingle();

  return (
    <PlatformShell
      user={{
        id: context.user.id,
        email: context.user.email || '',
        full_name: profile?.full_name || undefined,
        first_name: profile?.first_name || undefined,
        last_name: profile?.last_name || undefined,
        avatar_url: profile?.avatar_url || undefined,
      }}
      role="host_shop"
    >
      {children}
    </PlatformShell>
  );
}
