import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopAdminPartnerOptions, getHostShopBoard, HOST_SHOP_ADMIN_COOKIE } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';
import { provisionPartnerFromBarberApplication } from '@/lib/partners/provision-barber-partner';
import HostShopMediaCarousel from '@/components/partners/HostShopMediaCarousel';

async function selectAdminPartner(formData: FormData) {
  'use server';
  await requireRole(['super_admin', 'admin', 'org_admin']);
  const partnerId = String(formData.get('partnerId') ?? '').trim();
  if (!partnerId) redirect('/host-shop/dashboard');
  const db = await requireAdminClient();
  const { data: partner } = await db.from('partners').select('id, status, approval_status, verification_status, is_active, partner_type, program_type, programs').eq('id', partnerId).maybeSingle();
  const typeText = [partner?.partner_type, partner?.program_type, ...(Array.isArray(partner?.programs) ? partner.programs : [])].filter(Boolean).join(' ').toLowerCase();
  const eligible = partner && partner.status === 'active' && partner.approval_status === 'approved' && partner.verification_status === 'verified' && partner.is_active !== false && /(barber|cosmet|nail|esthetic|salon|shop|training_site)/.test(typeText);
  if (!eligible) redirect('/host-shop/dashboard?error=inactive_partner');
  const cookieStore = await cookies();
  cookieStore.set(HOST_SHOP_ADMIN_COOKIE, partnerId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 3600 });
  redirect('/host-shop/dashboard');
}

async function clearAdminPartner() {
  'use server';
  await requireRole(['super_admin', 'admin', 'org_admin']);
  const cookieStore = await cookies();
  cookieStore.set(HOST_SHOP_ADMIN_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  redirect('/host-shop/dashboard');
}

async function ensureCanonicalPartner(user: { id: string; email?: string | null }) {
  const db = await requireAdminClient();
  const { data: link } = await db.from('partner_users').select('partner_id,status').eq('user_id', user.id).eq('status', 'active').limit(1).maybeSingle();
  if (link?.partner_id || !user.email) return;

  // Historical Barber applications can still be promoted once into the
  // canonical partner model. New applications must enter through partners.
  const { data: legacyApplication } = await db.from('barbershop_partner_applications')
    .select('id, shop_legal_name, shop_dba_name, owner_name, contact_name, contact_email, contact_phone, shop_address_line1, shop_address_line2, shop_city, shop_state, shop_zip, indiana_shop_license_number, supervisor_name, supervisor_license_number, supervisor_years_licensed, compensation_model, workers_comp_status, can_supervise_and_verify, mou_signed_at, mou_signature_data, status')
    .eq('contact_email', user.email).order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (legacyApplication?.status === 'approved') {
    const provisioned = await provisionPartnerFromBarberApplication(db, legacyApplication, { linkUserId: user.id });
    if (!provisioned) redirect('/host-shop/login?error=provisioning');
    return;
  }
  if (legacyApplication?.status === 'pending' || legacyApplication?.status === 'submitted') redirect('/host-shop/login?status=pending');
}

type PortalCard = { href: string; title: string; value?: string | number; detail: string; image: string };
function PortalImageCard({ card }: { card: PortalCard }) {
  return <Link href={card.href} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-blue-300 hover:shadow-md"><div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100"><Image src={card.image} alt={`${card.title} Host Shop workspace`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" /></div><div className="p-5">{card.value !== undefined ? <p className="text-3xl font-black text-slate-950">{card.value}</p> : null}<h2 className={`${card.value !== undefined ? 'mt-1' : ''} font-black text-slate-950`}>{card.title}</h2><p className="mt-1 text-sm font-medium leading-6 text-slate-700">{card.detail}</p></div></Link>;
}

export default async function HostShopDashboardView() {
  const { user, effectiveRoles } = await requireRole(HOST_SHOP_ROLES);
  const isPlatformAdmin = effectiveRoles.some((role) => ['super_admin', 'admin', 'org_admin'].includes(role));
  if (!isPlatformAdmin) await ensureCanonicalPartner(user);

  const db = await requireAdminClient();
  const previewSubject = isPlatformAdmin
    ? await resolvePortalPreviewSubject(db, user.id)
    : { userId: user.id, previewing: false };
  const boardUserId = previewSubject.previewing ? previewSubject.userId : user.id;

  let board: Awaited<ReturnType<typeof getHostShopBoard>> | null = null;
  try {
    board = await getHostShopBoard(boardUserId);
  } catch (error) {
    if (isPlatformAdmin && error instanceof Error && error.message === 'HOST_SHOP_ADMIN_PARTNER_REQUIRED') {
      const partners = (await getHostShopAdminPartnerOptions()).filter((partner: any) => partner.status === 'active' && partner.approval_status === 'approved' && partner.verification_status === 'verified' && partner.is_active !== false);
      return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="relative h-52 w-full"><Image src="/images/pages/barber-gallery-1.webp" alt="Host Shop apprenticeship workspace" fill priority className="object-cover" sizes="100vw" /></div><div className="p-7 sm:p-9"><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">Admin portal access</p><h1 className="mt-2 text-3xl font-black text-slate-950">Choose an active verified Host Shop</h1><form action={selectAdminPartner} className="mt-6 flex flex-col gap-3 sm:flex-row"><select name="partnerId" required className="min-h-12 flex-1 rounded-xl border border-slate-400 bg-white px-4 py-3 font-semibold"><option value="">Select Host Shop</option>{partners.map((partner: any) => <option key={partner.id} value={partner.id}>{partner.name} {partner.city ? `— ${partner.city}, ${partner.state || ''}` : ''}</option>)}</select><button className="min-h-12 rounded-xl bg-brand-blue-700 px-6 py-3 font-black text-white">Open Host Shop portal</button></form></div></section></main>;
    }
    if (!isPlatformAdmin && error instanceof Error && error.message === 'HOST_SHOP_ACCESS_DENIED') redirect('/host-shop/login?error=no_partner');
    throw error;
  }
  if (!board) redirect('/host-shop/login?error=no_partner');

  if (board.partner?.approval_status !== 'approved' || board.partner?.verification_status !== 'verified' || board.partner?.status !== 'active') redirect('/host-shop/onboarding');
  if (!board.partner?.mou_signed) redirect(board.onboardingPaths.signMou);
  if (!board.partner?.onboarding_completed) redirect('/host-shop/orientation');

  const registeredCount = board.registeredPrograms.length;
  const competencyValue = registeredCount
    ? `${registeredCount} registered occupation${registeredCount === 1 ? '' : 's'}`
    : 'Blocked';
  const competencyDetail = registeredCount
    ? board.registeredPrograms.map((program) => `${program.rapidsCode}: ${program.competencyCount} competencies / ${program.rtiHours} RTI`).join(' · ')
    : 'No active registered-program standard is configured for the assigned occupation.';

  const summaryCards: PortalCard[] = [
    { href: '/host-shop/dashboard/apprentices', title: 'Active apprentices', value: board.apprentices.length, detail: 'View apprentices currently placed with this verified Host Shop.', image: '/images/pages/admin-employers-hero.webp' },
    { href: '/host-shop/dashboard/hours/pending', title: 'Work entries pending review', value: board.pendingHoursCount, detail: 'Verify supervised work records assigned to this Host Shop.', image: '/images/pages/training-classroom.webp' },
    { href: '/host-shop/dashboard/competencies', title: 'Registered standards', value: competencyValue, detail: competencyDetail, image: '/images/pages/competency-test-hero.webp' },
    { href: '/host-shop/dashboard/documents', title: 'Required documents', value: board.requiredDocumentCount ? `${board.acceptedDocumentCount}/${board.requiredDocumentCount}` : board.partner?.documents_verified ? 'Complete' : 'Review', detail: 'Maintain MOU, licenses, insurance, payroll evidence, and required Host Shop records.', image: '/images/pages/comp-home-highlight-success.webp' },
  ];
  const toolCards: PortalCard[] = [
    { href: '/host-shop/orientation', title: 'Required orientation', detail: 'Review recruiting, payroll, WIOA, geofencing, work approval, competencies, transfer-credit rules, RAPIDS, and compliance.', image: '/images/pages/academic-integrity-hero.webp' },
    { href: '/host-shop/dashboard/match-requests', title: 'Match requests', detail: 'Review apprentice placement requests for your shop.', image: '/images/pages/workone-packet-2.webp' },
    { href: '/host-shop/dashboard/attendance/record', title: 'Record attendance', detail: 'Record attendance against the active apprentice placement.', image: '/images/pages/program-holder-page-1.webp' },
    { href: '/host-shop/dashboard/wages', title: 'Wage compliance', detail: 'Verify actual wages against the registered occupation and employer-specific RAPIDS schedule.', image: '/images/pages/admin-wioa-hero.webp' },
    { href: '/host-shop/dashboard/reports', title: 'Reporting center', detail: 'Review documented work, competencies, attendance, RTI, and compliance records.', image: '/images/heroes/lms-analytics.webp' },
    { href: '/host-shop/dashboard/profile', title: 'Shop profile', detail: 'Maintain the approved shop profile, logo, flyer, and operating information.', image: '/images/pages/about-employer-partners.webp' },
  ];
  const partnerName = board.partner?.name || board.shops[0]?.name || '';
  const { data: publicProfile } = partnerName
    ? await db.from('public_host_shops').select('media_gallery,video_url').ilike('display_name', `%${partnerName}%`).limit(1).maybeSingle()
    : { data: null };
  const publicMedia = Array.isArray(publicProfile?.media_gallery)
    ? publicProfile.media_gallery.filter((item: any) => item && typeof item.url === 'string')
    : [];

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="grid lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch"><div className="p-6 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">Host Shop</p><h1 className="mt-2 text-3xl font-black text-slate-950">{board.partner?.name || board.shops[0]?.name || 'Host Shop'}</h1><p className="mt-2 font-medium text-slate-700">Shared registered-apprenticeship workspace</p>{board.registeredPrograms.length ? <div className="mt-3 flex flex-wrap gap-2">{board.registeredPrograms.map((program) => <span key={program.rapidsCode} className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-900">{program.label} · RAPIDS {program.rapidsCode}</span>)}</div> : null}{board.shops[0]?.city ? <p className="mt-2 text-sm font-medium text-slate-700">{board.shops[0].city}, {board.shops[0].state}</p> : null}</div><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-900">Verified Partner</span><span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-900">MOU Signed</span>{isPlatformAdmin ? <form action={clearAdminPartner}><button className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold">Change Host Shop</button></form> : null}</div></div>{board.unconfiguredPrograms.length ? <div role="alert" className="mt-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm font-semibold leading-6 text-amber-950">Regulated progress is blocked for: {board.unconfiguredPrograms.map((program) => program.programSlug || 'unknown occupation').join(', ')}. An active approved registered-program standard must be configured before competencies, RTI, or regulated OJL are credited.</div> : null}</div><div className="relative min-h-[240px]"><Image src="/images/pages/workforce-board-page-7.webp" alt="Host Shop supervised apprenticeship workspace" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 42vw" /></div></div></section>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{summaryCards.map((card) => <PortalImageCard key={card.title} card={card} />)}</section>
    {publicMedia.length || publicProfile?.video_url ? <section className="mt-8"><h2 className="mb-4 text-2xl font-black text-slate-950">Your public Host Shop gallery</h2><HostShopMediaCarousel shopName={partnerName} items={publicMedia} videoUrl={publicProfile?.video_url || undefined} /></section> : null}
    <section className="mt-8"><h2 className="text-2xl font-black text-slate-950">Host Shop tools</h2><p className="mt-1 text-sm font-medium text-slate-700">Every workspace uses the same verified partner, shop, placement, registered-program contract, and audit records.</p><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{toolCards.map((card) => <PortalImageCard key={card.title} card={card} />)}</div></section>
  </main>;
}
