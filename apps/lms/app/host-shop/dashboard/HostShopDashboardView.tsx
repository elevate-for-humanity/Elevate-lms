import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES, normalizeRole } from '@/lib/rbac/role-matrix';
import {
  getHostShopBoard,
  HOST_SHOP_ADMIN_COOKIE,
} from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';
import { provisionPartnerFromBarberApplication } from '@/lib/partners/provision-barber-partner';
import HostShopMediaCarousel from '@/components/partners/HostShopMediaCarousel';
import { PwaInstallButton } from '@/components/pwa/PwaInstallButton';

async function clearAdminPartner() {
  'use server';
  await requireRole(['super_admin', 'admin', 'org_admin']);
  const cookieStore = await cookies();
  cookieStore.set(HOST_SHOP_ADMIN_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
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

type PortalCard = {
  href: string;
  title: string;
  value?: string | number;
  detail: string;
  image: string;
};
function PortalImageCard({ card }: { card: PortalCard }) {
  return (
    <Link
      href={card.href}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-blue-300 hover:shadow-md"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">
        <Image
          src={card.image}
          alt={`${card.title} Host Shop workspace`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="p-5">
        {card.value !== undefined ? (
          <p className="text-3xl font-black text-slate-950">{card.value}</p>
        ) : null}
        <h2 className={`${card.value !== undefined ? 'mt-1' : ''} font-black text-slate-950`}>
          {card.title}
        </h2>
        <p className="mt-1 text-sm font-medium leading-6 text-slate-700">{card.detail}</p>
      </div>
    </Link>
  );
}

export default async function HostShopDashboardView() {
  const { user, effectiveRoles } = await requireRole(HOST_SHOP_ROLES);
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
              <p className="mt-3 max-w-2xl text-sm font-medium leading-6 text-slate-700">This neutral preview confirms that the Host Shop PWA is operational without attaching Admin to a business record. Select a shop from the secured Admin dashboard to open its audited portal.</p>
              <div className="mt-6 flex flex-wrap gap-3"><a href="https://admin.elevateforhumanity.org/dashboard" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-6 py-3 font-black text-white">Select a Host Shop in Admin</a><a href="https://admin.elevateforhumanity.org/partners" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-black text-slate-950">Manage partners</a></div>
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
  const partnerVerified = board.partner?.verification_status === 'verified';
  const partnerMouSigned = board.partner?.mou_signed === true;
  const partnerOnboardingComplete = board.partner?.onboarding_completed === true;

  // Approved owners retain operational portal access while every incomplete
  // compliance milestone remains prominently visible across the portal.
  if (!isPlatformAdmin) {
    if (!partnerApproved) redirect('/host-shop/onboarding');
  }

  const registeredCount = board.registeredPrograms.length;
  const timeBasedCount = board.timeBasedPrograms.length;
  const competencyValue = registeredCount
    ? `${registeredCount} registered occupation${registeredCount === 1 ? '' : 's'}`
    : timeBasedCount
      ? `${Number(board.timeBasedPrograms[0]?.hours || 0).toLocaleString()}h target`
      : 'Blocked';
  const competencyDetail = registeredCount
    ? board.registeredPrograms
        .map(
          (program) =>
            `${program.rapidsCode}: ${program.competencyCount} competencies / ${program.rtiHours} RTI`,
        )
        .join(' · ')
    : timeBasedCount
      ? 'Time-based apprenticeship progress from Host Shop-approved OJL records.'
      : 'No active registered-program standard is configured for the assigned occupation.';

  const summaryCards: PortalCard[] = [
    {
      href: '/host-shop/dashboard/apprentices',
      title: 'Active apprentices',
      value: board.apprentices.length,
      detail: 'View apprentices currently placed with this verified Host Shop.',
      image: '/images/pages/admin-employers-hero.webp',
    },
    {
      href: '/host-shop/dashboard/hours/pending',
      title: 'Work entries pending review',
      value: board.pendingHoursCount,
      detail: 'Verify supervised work records assigned to this Host Shop.',
      image: '/images/pages/training-classroom.webp',
    },
    {
      href: registeredCount ? '/host-shop/dashboard/competencies' : '/host-shop/dashboard/hours',
      title: registeredCount ? 'Registered standards' : 'Apprenticeship progress',
      value: competencyValue,
      detail: competencyDetail,
      image: '/images/pages/competency-test-hero.webp',
    },
    {
      href: '/host-shop/dashboard/documents',
      title: 'Required documents',
      value: `${board.acceptedDocumentCount}/${board.requiredDocumentCount}`,
      detail: board.documentsComplete
        ? 'All required compliance documents are accepted.'
        : `${board.missingDocuments.length} missing and ${board.pendingDocuments.length} awaiting review.`,
      image: '/images/pages/comp-home-highlight-success.webp',
    },
  ];
  const toolCards: PortalCard[] = [
    {
      href: '/host-shop/orientation',
      title: 'Required orientation',
      detail:
        'Review recruiting, payroll, WIOA, geofencing, work approval, competencies, transfer-credit rules, RAPIDS, and compliance.',
      image: '/images/pages/academic-integrity-hero.webp',
    },
    {
      href: '/host-shop/dashboard/match-requests',
      title: 'Match requests',
      detail: 'Review apprentice placement requests for your shop.',
      image: '/images/pages/workone-packet-2.webp',
    },
    {
      href: '/host-shop/dashboard/attendance/record',
      title: 'Record attendance',
      detail: 'Record attendance against the active apprentice placement.',
      image: '/images/pages/program-holder-page-1.webp',
    },
    {
      href: '/host-shop/dashboard/wages',
      title: 'Wage compliance',
      detail:
        'Verify actual wages against the registered occupation and employer-specific RAPIDS schedule.',
      image: '/images/pages/admin-wioa-hero.webp',
    },
    {
      href: '/host-shop/dashboard/reports',
      title: 'Reporting center',
      detail: 'Review documented work, competencies, attendance, RTI, and compliance records.',
      image: '/images/heroes/lms-analytics.webp',
    },
    {
      href: '/host-shop/dashboard/profile',
      title: 'Shop profile',
      detail: 'Maintain the approved shop profile, logo, flyer, and operating information.',
      image: '/images/pages/about-employer-partners.webp',
    },
    {
      href: '/host-shop/dashboard/programs',
      title: 'Programs & standards',
      detail:
        'Review the occupation assigned to this Host Shop and whether its registered standard is configured.',
      image: '/images/pages/programs-hero-vibrant.webp',
    },
    {
      href: '/host-shop/dashboard/schedule',
      title: 'Training schedule',
      detail: 'View attendance sessions hosted by active users assigned to this Host Shop.',
      image: '/images/pages/admin-apprenticeships-classroom.webp',
    },
    {
      href: '/host-shop/dashboard/store',
      title: 'Host Shop store',
      detail: 'Open verified purchasing options and approved service requests.',
      image: '/images/pages/store-page-1.webp',
    },
  ];
  const operatingSteps = [
    {
      href: '/host-shop/orientation',
      title: '1. Complete Host Shop orientation',
      detail:
        'Review responsibilities, payroll, safety, geofencing, work approvals, competencies, and required records.',
    },
    {
      href: '/host-shop/dashboard/apprentices',
      title: '2. Confirm each apprentice',
      detail:
        'Verify the apprentice, active placement, supervisor, occupation, start date, and contact information.',
    },
    {
      href: '/host-shop/dashboard/schedule',
      title: '3. Set the training schedule',
      detail: 'Keep the apprentice schedule and supervised training sessions current.',
    },
    {
      href: '/host-shop/dashboard/attendance/record',
      title: '4. Record attendance and work',
      detail:
        'Make sure apprentices clock at the approved site and that supervised work is documented.',
    },
    {
      href: '/host-shop/dashboard/hours/pending',
      title: '5. Review hours every week',
      detail:
        'Approve accurate OJL entries promptly; return incorrect entries with a clear correction note.',
    },
    {
      href: '/host-shop/dashboard/competencies',
      title: '6. Verify competencies',
      detail:
        'Record observed skills only after the apprentice demonstrates them under qualified supervision.',
    },
    {
      href: '/host-shop/dashboard/reports',
      title: '7. Check compliance monthly',
      detail:
        'Review wages, RTI, OJL, attendance, documents, and exceptions before reporting deadlines.',
    },
  ] as const;

  const partnerName = board.partner?.name || board.shops[0]?.name || '';
  const { data: publicProfile } = partnerName
    ? await db
        .from('public_host_shops')
        .select('media_gallery,video_url')
        .ilike('display_name', `%${partnerName}%`)
        .limit(1)
        .maybeSingle()
    : { data: null };
  const publicMedia = Array.isArray(publicProfile?.media_gallery)
    ? publicProfile.media_gallery.filter((item: any) => item && typeof item.url === 'string')
    : [];
  const heroImage = /salon saloon/i.test(partnerName)
    ? '/images/partners/salon-saloon/team-interior.webp'
    : '/images/pages/workforce-board-page-7.webp';

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-black text-slate-950">Host Shop app</p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            Install this exact Host Shop dashboard for direct access to apprentices, hours,
            attendance, competencies, and reports.
          </p>
        </div>
        <PwaInstallButton
          label="Install Host Shop App"
          installedLabel="Host Shop App Installed"
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-800 px-5 py-3 text-sm font-black text-white hover:bg-blue-900"
        />
      </section>
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">
                  Host Shop
                </p>
                <h1 className="mt-2 text-3xl font-black text-slate-950">
                  {board.partner?.name || board.shops[0]?.name || 'Host Shop'}
                </h1>
                <p className="mt-2 font-medium text-slate-700">
                  Shared registered-apprenticeship workspace
                </p>
                {board.registeredPrograms.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {board.registeredPrograms.map((program) => (
                      <span
                        key={program.rapidsCode}
                        className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-900"
                      >
                        {program.label} · RAPIDS {program.rapidsCode}
                      </span>
                    ))}
                  </div>
                ) : null}
                {board.shops[0]?.city ? (
                  <p className="mt-2 text-sm font-medium text-slate-700">
                    {board.shops[0].city}, {board.shops[0].state}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${partnerVerified ? 'bg-green-100 text-green-900' : 'bg-amber-100 text-amber-950'}`}
                >
                  {partnerVerified ? 'Verified Partner' : 'Verification Pending'}
                </span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${partnerMouSigned ? 'bg-green-100 text-green-900' : 'bg-amber-100 text-amber-950'}`}
                >
                  {partnerMouSigned ? 'MOU Signed' : 'MOU Pending'}
                </span>
                {isPlatformAdmin ? (
                  <form action={clearAdminPartner}>
                    <button className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold">
                      Change Host Shop
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
            {isPlatformAdmin &&
            (!partnerVerified || !partnerMouSigned || !partnerOnboardingComplete) ? (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-blue-300 bg-blue-50 p-4 text-sm font-semibold leading-6 text-blue-950"
              >
                Admin review mode: this Host Shop record is accessible for audit and setup, but
                owner access remains gated until verification, MOU, and onboarding requirements are
                complete.
              </div>
            ) : null}
            {board.unconfiguredPrograms.length ? (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950"
              >
                Regulated progress is blocked for:{' '}
                {board.unconfiguredPrograms
                  .map((program) => program.programSlug || 'unknown occupation')
                  .join(', ')}
                . An active approved registered-program standard must be configured before
                competencies, RTI, or regulated OJL are credited.
              </div>
            ) : null}
          </div>
          <div className="relative min-h-[240px]">
            <Image
              src={heroImage}
              alt={`${partnerName || 'Host Shop'} supervised apprenticeship workspace`}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 42vw"
            />
          </div>
        </div>
      </section>
      {!board.documentsComplete ? (
        <section
          role="alert"
          className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-950"
        >
          <h2 className="text-lg font-black">Required compliance documents are incomplete</h2>
          <p className="mt-1 text-sm font-semibold">
            Upload or replace every item below before the Host Shop is considered fully ready.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {board.missingDocuments.map((item: any) => (
              <li
                key={item.document_type}
                className="rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-bold"
              >
                Missing: {item.document_name}
              </li>
            ))}
            {board.pendingDocuments.map((item: any) => (
              <li
                key={item.document_type}
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-950"
              >
                In review: {item.document_name}
              </li>
            ))}
          </ul>
          <Link
            href="/host-shop/onboarding/documents"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-red-700 px-5 py-3 font-black text-white hover:bg-red-800"
          >
            Complete required documents
          </Link>
        </section>
      ) : null}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <PortalImageCard key={card.title} card={card} />
        ))}
      </section>
      {publicMedia.length || publicProfile?.video_url ? (
        <section className="mt-8">
          <h2 className="mb-4 text-2xl font-black text-slate-950">Your public Host Shop gallery</h2>
          <HostShopMediaCarousel
            shopName={partnerName}
            items={publicMedia}
            videoUrl={publicProfile?.video_url || undefined}
          />
        </section>
      ) : null}
      <section
        className="mt-8 rounded-3xl border border-cyan-200 bg-cyan-50 p-6 sm:p-8"
        aria-labelledby="host-shop-operating-guide"
      >
        <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-800">
          Start here and repeat weekly
        </p>
        <h2 id="host-shop-operating-guide" className="mt-2 text-2xl font-black text-slate-950">
          Run your apprenticeship step by step
        </h2>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-700">
          Use this checklist for every apprentice. Each step opens the same verified shop,
          placement, geofence, hours, competency, and compliance records used by the program.
        </p>
        <ol className="mt-5 grid gap-3 md:grid-cols-2">
          {operatingSteps.map((step) => (
            <li key={step.title}>
              <Link
                href={step.href}
                className="block h-full rounded-2xl border border-cyan-200 bg-white p-4 transition hover:border-brand-blue-400 hover:shadow-sm"
              >
                <h3 className="font-black text-slate-950">{step.title}</h3>
                <p className="mt-1 text-sm font-medium leading-6 text-slate-700">{step.detail}</p>
              </Link>
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-8">
        <h2 className="text-2xl font-black text-slate-950">Host Shop tools</h2>
        <p className="mt-1 text-sm font-medium text-slate-700">
          Every workspace uses the same verified partner, shop, placement, registered-program
          contract, and audit records.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {toolCards.map((card) => (
            <PortalImageCard key={card.title} card={card} />
          ))}
        </div>
      </section>
    </main>
  );
}
