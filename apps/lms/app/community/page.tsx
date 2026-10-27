import { redirect } from 'next/navigation';
import { requireRole } from '@/lib/auth/require-role';
import { ALL_AUTHENTICATED_ROLES } from '@/lib/rbac/role-matrix';
import SocialLearningCommunity from '@/components/SocialLearningCommunity';
import { BusinessNetworkCard } from '@/components/portal/BusinessNetworkCard';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Elevate Community', robots: { index: false, follow: false } };
export default async function Page() {
  const { user, profile, effectiveRoles } = await requireRole(ALL_AUTHENTICATED_ROLES);
  if (effectiveRoles.some(role => ['super_admin', 'admin'].includes(role))) {
    return <main className="mx-auto max-w-7xl px-4 py-6"><BusinessNetworkCard href="#network-feed" label="Elevate Community" /><div id="network-feed"><SocialLearningCommunity userId={user.id} userName={profile.full_name || 'Administration'} /></div></main>;
  }
  if (effectiveRoles.some(role => ['program_holder', 'site_coordinator', 'provider_admin'].includes(role))) redirect('/program-holder/community');
  if (effectiveRoles.some(role => ['partner', 'host_shop', 'host_shop_admin'].includes(role))) redirect('/host-shop/dashboard/community');
  if (effectiveRoles.some(role => ['employer', 'sponsor'].includes(role))) redirect('/employer/community');
  redirect('/lms/community');
}
