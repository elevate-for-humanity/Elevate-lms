import HostShopWelcome from '@/components/host-shop/HostShopWelcome';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES, normalizeRole } from '@/lib/rbac/role-matrix';
import { getHostShopBoard, HOST_SHOP_ADMIN_COOKIE } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';
import { provisionPartnerFromBarberApplication } from '@/lib/partners/provision-barber-partner';
import {
  HOST_SHOP_PREVIEW_SESSION_COOKIE,
  resolveHostShopAdminPreview,
} from '@/lib/admin/host-shop-preview';
import {
  PORTAL_PREVIEW_ACTOR_COOKIE,
  PORTAL_PREVIEW_COOKIE,
  PORTAL_PREVIEW_SESSION_COOKIE,
} from '@/lib/admin/portal-preview';

async function clearAdminPartner() {
  'use server';
  await requireRole(['super_admin', 'admin', 'org_admin']);
  const cookieStore = await cookies();
  for (const name of [
    HOST_SHOP_ADMIN_COOKIE,
    HOST_SHOP_PREVIEW_SESSION_COOKIE,
    PORTAL_PREVIEW_COOKIE,
    PORTAL_PREVIEW_ACTOR_COOKIE,
    PORTAL_PREVIEW_SESSION_COOKIE,
  ]) {
    cookieStore.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  }
  redirect('/host-shop/dashboard');
}

async function ensureCanonicalPartner(user: { id: string; email?: string | null }) {
  const db = await requireAdminClient();
  const { data: link } = await db
    .from('partner_users')
    .select('partner_id,status')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();
  if (link?.partner_id || !user.email) return;

  // Historical Barber applications can still be promoted once into the
  // canonical partner model. New applications must enter through partners.
  const { data: legacyApplication } = await db
    .from('barbershop_partner_applications')
    .select(
      'id, shop_legal_name, shop_dba_name, owner_name, contact_name, contact_email, contact_phone, shop_address_line1, shop_address_line2, shop_city, shop_state, shop_zip, indiana_shop_license_number, supervisor_name, supervisor_license_number, supervisor_years_licensed, compensation_model, workers_comp_status, can_supervise_and_verify, mou_signed_at, mou_signature_data, status',
    )
    .eq('contact_email', user.email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (legacyApplication?.status === 'approved') {
    const provisioned = await provisionPartnerFromBarberApplication(db, legacyApplication, {
      linkUserId: user.id,
    });
    if (!provisioned) redirect('/host-shop/login?error=provisioning');
    return;
  }
  if (legacyApplication?.status === 'pending' || legacyApplication?.status === 'submitted')
    redirect('/host-shop/login?status=pending');
}

export default async function HostShopDashboardView() {
  const preview = await resolveHostShopAdminPreview();
  const { user, effectiveRoles } = preview
    ? {
        user: { id: preview.actorId, email: preview.actorEmail },
        effectiveRoles: [preview.actorRole],
      }
    : await requireRole(HOST_SHOP_ROLES);
  const db = await requireAdminClient();
  const { data: actorProfile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const authoritativeActorRole = normalizeRole(actorProfile?.role);
  const isPlatformAdmin =
    (authoritativeActorRole !== null &&
      ['super_admin', 'admin', 'org_admin'].includes(authoritativeActorRole)) ||
    effectiveRoles.some((role) => ['super_admin', 'admin', 'org_admin'].includes(role));
  if (!isPlatformAdmin) await ensureCanonicalPartner(user);

  let board: Awaited<ReturnType<typeof getHostShopBoard>> | null = null;
  try {
    // Host Shop tenancy is selected with HOST_SHOP_ADMIN_COOKIE. Do not reuse
    // an apprentice/student preview subject here: a learner preview cookie can
    // otherwise replace the administrator identity and make the selected Host
    // Shop appear inaccessible immediately after it is opened.
    board = await getHostShopBoard(user.id);
  } catch (error) {
    if (
      isPlatformAdmin &&
      error instanceof Error &&
      ['HOST_SHOP_ADMIN_PARTNER_REQUIRED', 'HOST_SHOP_ACCESS_DENIED'].includes(error.message)
    ) {
      return (
        <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="relative h-52 w-full">
              <Image
                src="/images/pages/barber-gallery-1.webp"
                alt="Host Shop apprenticeship workspace"
                fill
                priority
                className="object-cover"
                sizes="100vw"
              />
            </div>
            <div className="p-7 sm:p-9">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">
                Admin portal access
              </p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">Host Shop PWA</h1>
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-700">
                No Host Shop is selected. Select a shop from the secured Admin dashboard to open its
                saved records in the audited portal preview.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="https://admin.elevateforhumanity.org/partners"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 font-black text-white"
                >
                  Select a Host Shop in Admin
                </a>
                <a
                  href="https://admin.elevateforhumanity.org/partners"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-black text-slate-950"
                >
                  Manage partners
                </a>
              </div>
            </div>
          </section>
        </main>
      );
    }
    if (!isPlatformAdmin && error instanceof Error && error.message === 'HOST_SHOP_ACCESS_DENIED')
      redirect('/host-shop/login?error=no_partner');
    throw error;
  }
  if (!board) redirect('/host-shop/login?error=no_partner');

  const partnerApproved =
    board.partner?.approval_status === 'approved' && board.partner?.status === 'active';

  // Approved owners retain operational portal access while every incomplete
  // compliance milestone remains prominently visible across the portal.
  if (!isPlatformAdmin) {
    if (!partnerApproved) redirect('/host-shop/onboarding');
  }

  const shopName = board.partner?.name || board.shops[0]?.name || 'Your Host Shop';
  // Display the selected shop account, never the administrator's photo or
  // another shop's training image. Missing photos retain a named initials banner.
  const { data: heroMember } = isPlatformAdmin
    ? await db.from('partner_users').select('user_id')
        .eq('partner_id', board.partner.id).eq('status', 'active')
        .order('created_at', { ascending: true }).limit(1).maybeSingle()
    : { data: { user_id: user.id } };
  const { data: heroProfile } = heroMember?.user_id
    ? await db.from('profiles').select('full_name,avatar_url').eq('id', heroMember.user_id).maybeSingle()
    : { data: null };
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-1 py-4 sm:px-4">
      <HostShopWelcome shopName={shopName} partnerId={board.partner.id} ownerName={heroProfile?.full_name} profileImageUrl={heroProfile?.avatar_url}>
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-slate-950">{shopName}</h1>
            <p className="mt-1 text-sm text-slate-600">Your salon training workspace</p>
          </div>
          {isPlatformAdmin ? (
            <form action={clearAdminPartner}>
              <button className="min-h-11 rounded-xl border px-4 font-bold">
                Change Host Shop
              </button>
            </form>
          ) : null}
        </header>
        <section aria-label="Today at your shop" className="grid gap-3 sm:grid-cols-3">
          {[
            {
              title: 'Apprentices',
              value: board.apprentices.length,
              href: '/host-shop/dashboard/apprentices',
              detail: 'Open your assigned students.',
            },
            {
              title: 'Hours to review',
              value: board.pendingHoursCount,
              href: '/host-shop/dashboard/hours/pending',
              detail: 'Check submitted shop hours.',
            },
            {
              title: 'Documents to resolve',
              value: board.missingDocuments.length + board.pendingDocuments.length,
              href: '/host-shop/dashboard/documents',
              detail: 'Review missing or pending items.',
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <p className="text-3xl font-black">{item.value}</p>
              <h2 className="mt-2 font-bold">{item.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
            </Link>
          ))}
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-black">What would you like to do?</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/host-shop/dashboard/practical-log"
              className="min-h-11 rounded-xl bg-neutral-950 px-4 py-3 font-bold text-white"
            >
              Record student progress
            </Link>
            <Link
              href="/host-shop/dashboard/schedule"
              className="min-h-11 rounded-xl border px-4 py-3 font-bold"
            >
              Plan shop training
            </Link>
            <Link
              href="/host-shop/email"
              className="min-h-11 rounded-xl border px-4 py-3 font-bold"
            >
              Contact Elevate
            </Link>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Open the sidebar for your training tools, documents, phone, and Barber &amp; Beauty
            Network. On a phone, tap the menu at the top.
          </p>
        </section>
      </HostShopWelcome>
    </div>
  );
}
