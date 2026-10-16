import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/partner/access';
import { PlatformShell } from '@/components/platform/PlatformShell';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES, normalizeRole } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import { getHostShopReadinessItems } from '@/lib/partners/host-shop-readiness';
import HostShopReadinessBanner from '@/components/partners/HostShopReadinessBanner';
import { headers } from 'next/headers';
import { resolveHostShopAdminPreview } from '@/lib/admin/host-shop-preview';

export const dynamic = 'force-dynamic';

/**
 * Single authorization + readiness boundary for every /host-shop/dashboard/* route.
 * A canonical Host Shop role and a valid Host Shop relationship are required.
 * Compliance gaps are highlighted on every operational page. The portal remains
 * usable so an approved shop can upload evidence, configure operations, and export
 * its own records while incomplete items remain visibly non-compliant.
 */
export default async function HostShopDashboardLayout({ children }: { children: React.ReactNode }) {
  // Relationship data alone is not permission to enter the Host Shop portal.
  // Apprentices can legitimately have an active placement at a shop, so enforce
  // the canonical role taxonomy before resolving partner/shop context.
  const preview = await resolveHostShopAdminPreview();
  const auth = preview
    ? {
        user: { id: preview.actorId, email: preview.actorEmail },
        effectiveRoles: [preview.actorRole],
      }
    : await requireRole(HOST_SHOP_ROLES);
  const db = await requireAdminClient();
  const { data: actorProfile } = await db
    .from('profiles')
    .select('id, role, full_name, first_name, last_name, avatar_url')
    .eq('id', auth.user.id)
    .maybeSingle();
  const actorRole = normalizeRole(actorProfile?.role);
  const isPlatformAdmin =
    (actorRole !== null && ['super_admin', 'admin', 'org_admin'].includes(actorRole)) ||
    auth.effectiveRoles.some((role) => ['super_admin', 'admin', 'org_admin'].includes(role));
  const pathname = (await headers()).get('x-pathname') || '/host-shop/dashboard';

  // The dashboard page owns the administrator's audited-shop selection. Do not
  // force platform administrators through an owner's membership or onboarding
  // gates before that selection can be made.
  if (isPlatformAdmin) {
    // Admins may enter this layout before choosing a shop. Once the audited
    // shop cookie is present, use the exact same readiness contract shown to
    // the owner so reports and every sub-page cannot hide compliance gaps.
    let readinessItems = null;
    try {
      readinessItems = getHostShopReadinessItems(await getHostShopBoard(auth.user.id));
    } catch (error) {
      if (
        !(error instanceof Error) ||
        !['HOST_SHOP_ADMIN_PARTNER_REQUIRED', 'HOST_SHOP_ACCESS_DENIED'].includes(error.message)
      ) {
        throw error;
      }
    }

    if (!readinessItems && pathname !== '/host-shop/dashboard') {
      const moduleName =
        pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'host shop module';
      return (
        <PlatformShell
          user={{
            id: auth.user.id,
            email: auth.user.email || '',
            full_name: actorProfile?.full_name || undefined,
            first_name: actorProfile?.first_name || undefined,
            last_name: actorProfile?.last_name || undefined,
            avatar_url: actorProfile?.avatar_url || undefined,
          }}
          role="host_shop"
        >
          <main className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
              Administrator portal preview
            </p>
            <h1 className="mt-2 text-3xl font-black capitalize text-slate-950">{moduleName}</h1>
            <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-slate-700">
              This Host Shop module is operational. Shop apprentices, hours, wages, documents,
              messages, and actions remain isolated until an administrator selects a specific shop
              through the audited Admin workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="https://admin.elevateforhumanity.org/partners"
                className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white"
              >
                Select a Host Shop in Admin
              </a>
              <a
                href="/host-shop/dashboard"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-950"
              >
                Host Shop PWA overview
              </a>
            </div>
          </main>
        </PlatformShell>
      );
    }

    return (
      <PlatformShell
        user={{
          id: auth.user.id,
          email: auth.user.email || '',
          full_name: actorProfile?.full_name || undefined,
          first_name: actorProfile?.first_name || undefined,
          last_name: actorProfile?.last_name || undefined,
          avatar_url: actorProfile?.avatar_url || undefined,
        }}
        role="host_shop"
      >
        {readinessItems ? <HostShopReadinessBanner items={readinessItems} /> : null}
        {children}
      </PlatformShell>
    );
  }

  const user = await getSessionUser();
  if (!user) redirect('/host-shop/login?redirect=/host-shop/dashboard');

  let board: Awaited<ReturnType<typeof getHostShopBoard>>;
  try {
    board = await getHostShopBoard(user.id);
  } catch (error) {
    if (error instanceof Error && error.message === 'HOST_SHOP_ACCESS_DENIED') {
      redirect('/host-shop/login?error=no_partner');
    }
    throw error;
  }

  // Saved and submitted Host Shop applications have a real portal identity,
  // but operational records stay blocked until Elevate approves the shop.
  // Keep these owners in the onboarding workspace instead of treating the
  // pending approval as a missing relationship and sending them back to login.
  const partnerApproved =
    board.partner?.status === 'active' && board.partner?.approval_status === 'approved';
  if (!partnerApproved) redirect('/host-shop/onboarding');

  const readinessItems = getHostShopReadinessItems(board);

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, first_name, last_name, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  return (
    <PlatformShell
      user={{
        id: user.id,
        email: user.email || '',
        full_name: profile?.full_name || undefined,
        first_name: profile?.first_name || undefined,
        last_name: profile?.last_name || undefined,
        avatar_url: profile?.avatar_url || undefined,
      }}
      role="host_shop"
    >
      <section
        className="mb-4 rounded-2xl border-2 border-blue-300 bg-blue-50 px-5 py-4 text-blue-950 shadow-sm"
        role="status"
        aria-label="Host Shop action notice"
      >
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-800">
          Host Shop action required
        </p>
        <h2 className="mt-1 text-lg font-black">Your production Host Shop portal is ready.</h2>
        <p className="mt-1 text-sm font-semibold leading-6">
          Sign in now and complete every required onboarding, agreement, and compliance document
          shown in your readiness checklist.
        </p>
        <a
          href="/host-shop/dashboard/documents"
          className="mt-3 inline-flex rounded-xl bg-blue-950 px-4 py-2 text-sm font-black text-white hover:bg-blue-900"
        >
          Complete required documents
        </a>
      </section>
      <HostShopReadinessBanner items={readinessItems} />
      <section role="alert" aria-label="Updated apprenticeship host shop procedures" className="mb-5 rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 text-amber-950">
        <p className="text-xs font-black uppercase tracking-widest">Important Host Shop Notice — October 16, 2026</p>
        <h2 className="mt-2 text-xl font-black">Apprenticeship training, geofence, timekeeping and RTI rollout</h2>
        <p className="mt-2 text-sm leading-6">Existing apprentices may continue supervised workplace training from their verified progress. Existing signed Host Shops are not being asked to sign the new 12-month partnership agreement retroactively.</p>
        <p className="mt-2 text-sm leading-6"><strong>Clock-in/out:</strong> Apprentices must clock in when arriving at their approved training site, clock out when leaving, and clock out for unpaid meal breaks. They must clock back in when returning to compensable training. Time outside the approved geofence is flagged or blocked for review; never invent hours or bypass location checks. Report technical or location errors to Elevate for documented correction.</p>
        <p className="mt-2 text-sm leading-6"><strong>Host responsibilities:</strong> Provide qualified supervision, safe hands-on occupational training, wages according to the approved wage progression (including any applicable $10/hour starting rate or compliant commission equivalent), and accurate OJL/competency verification. Confirm weekly hours with the apprentice's approved employment and training schedule; there is no universal weekly-hours requirement stated in this notice. Follow applicable break, wage and overtime laws.</p>
        <p className="mt-2 text-sm leading-6"><strong>RTI:</strong> Elevate coordinates theory instruction and is preparing its progressive rollout. Host Shops do not develop or teach RTI unless separately authorized. Apprentices can continue eligible supervised OJL while individual prerequisite and RTI schedules are finalized under their approved standards.</p>
        <div className="mt-4 rounded-xl border border-amber-300 bg-white p-4">
          <h3 className="font-black">Review your apprenticeship dashboard tools</h3>
          <p className="mt-2 text-sm leading-6">Appendix A competency sign-offs, workplace hours, wages, and host shop resources are available in the existing portal. Please review the instructions and check your assigned apprentices. Individual cut/style service counters, practical assessment scheduling, and synchronized student service-progress forms are being developed and are not yet available as completed features.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="/host-shop/dashboard/competencies" className="rounded-lg border border-amber-700 px-3 py-2 text-sm font-bold">Appendix A competencies</a>
            <a href="/host-shop/dashboard/hours" className="rounded-lg border border-amber-700 px-3 py-2 text-sm font-bold">Review OJL hours</a>
            <a href="/host-shop/dashboard/wages" className="rounded-lg border border-amber-700 px-3 py-2 text-sm font-bold">Wage requirements</a>
          </div>
        </div>
        <a href="/host-shop/dashboard/resources" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-amber-950 px-5 py-3 text-sm font-black text-white">Read the Host Shop operating guide</a>
      </section>
      {children}
    </PlatformShell>
  );
}
