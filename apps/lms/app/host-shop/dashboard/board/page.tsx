import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopAdminPartnerOptions, getHostShopBoard, HOST_SHOP_ADMIN_COOKIE } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function selectAdminPartner(formData: FormData) {
  'use server';
  await requireRole(['super_admin', 'admin', 'org_admin']);
  const partnerId = String(formData.get('partnerId') ?? '').trim();
  if (!partnerId) redirect('/host-shop/dashboard/board');
  const db = await requireAdminClient();
  const { data: partner } = await db.from('partners').select('id, status, approval_status, is_active, partner_type, program_type, programs').eq('id', partnerId).maybeSingle();
  const typeText = [partner?.partner_type, partner?.program_type, ...(Array.isArray(partner?.programs) ? partner.programs : [])].filter(Boolean).join(' ').toLowerCase();
  const eligible = partner && partner.status === 'active' && partner.approval_status === 'approved' && partner.is_active !== false && /(barber|cosmet|nail|esthetic|salon|shop|training_site)/.test(typeText);
  if (!eligible) redirect('/host-shop/dashboard/board?error=inactive_partner');
  const cookieStore = await cookies();
  cookieStore.set(HOST_SHOP_ADMIN_COOKIE, partnerId, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 3600 });
  redirect('/host-shop/dashboard/board');
}

async function clearAdminPartner() {
  'use server';
  await requireRole(['super_admin', 'admin', 'org_admin']);
  const cookieStore = await cookies();
  cookieStore.set(HOST_SHOP_ADMIN_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
  redirect('/host-shop/dashboard/board');
}

type PortalCard = { href: string; title: string; value?: string | number; detail: string; image: string };
function PortalImageCard({ card }: { card: PortalCard }) {
  return <Link href={card.href} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-brand-blue-300 hover:shadow-md"><div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100"><Image src={card.image} alt={`${card.title} Host Shop workspace`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" /></div><div className="p-5">{card.value !== undefined ? <p className="text-3xl font-black text-slate-950">{card.value}</p> : null}<h2 className={`${card.value !== undefined ? 'mt-1' : ''} font-black text-slate-950`}>{card.title}</h2><p className="mt-1 text-sm font-medium leading-6 text-slate-700">{card.detail}</p></div></Link>;
}

export default async function PartnerBoardPage() {
  const { user, effectiveRoles } = await requireRole(HOST_SHOP_ROLES);
  const isPlatformAdmin = effectiveRoles.some((role) => ['super_admin', 'admin', 'org_admin'].includes(role));
  let board: Awaited<ReturnType<typeof getHostShopBoard>> | null = null;
  try { board = await getHostShopBoard(user.id); } catch (error) {
    if (isPlatformAdmin && error instanceof Error && error.message === 'HOST_SHOP_ADMIN_PARTNER_REQUIRED') {
      const partners = (await getHostShopAdminPartnerOptions()).filter((partner: any) => partner.status === 'active' && partner.approval_status === 'approved' && partner.is_active !== false);
      return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="relative h-52 w-full"><Image src="/images/pages/workforce-board-page-7.webp" alt="Host Shop apprenticeship workspace" fill priority className="object-cover" sizes="100vw" /></div><div className="p-7 sm:p-9"><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">Admin portal access</p><h1 className="mt-2 text-3xl font-black text-slate-950">Choose an active approved Host Shop</h1><form action={selectAdminPartner} className="mt-6 flex flex-col gap-3 sm:flex-row"><select name="partnerId" required className="min-h-12 flex-1 rounded-xl border border-slate-400 bg-white px-4 py-3 font-semibold"><option value="">Select Host Shop</option>{partners.map((partner: any) => <option key={partner.id} value={partner.id}>{partner.name} {partner.city ? `— ${partner.city}, ${partner.state || ''}` : ''}</option>)}</select><button className="min-h-12 rounded-xl bg-brand-blue-700 px-6 py-3 font-black text-white">Open Host Shop portal</button></form></div></section></main>;
    }
    throw error;
  }
  if (!board) redirect('/host-shop/dashboard');

  const competencyBased = board.tradeInfo.progressModel === 'competency_based';
  const progressValue = competencyBased ? `${board.tradeInfo.competencyCount ?? 14} skills` : `${Number(board.tradeInfo.hours ?? 0).toLocaleString()}h`;
  const progressDetail = competencyBased
    ? `Appendix A competency sign-off · ${board.tradeInfo.rtiHours ?? 260} RTI hours`
    : 'Review required skills and complete supervisor verification.';

  const summaryCards: PortalCard[] = [
    { href: '/host-shop/dashboard/apprentices', title: 'Active apprentices', value: board.apprentices.length, detail: 'View apprentices currently placed with this approved Host Shop.', image: '/images/pages/barber-apprenticeship-hero.jpg' },
    { href: '/host-shop/dashboard/hours/pending', title: 'Work entries pending review', value: board.pendingHoursCount, detail: 'Verify supervised work records assigned to this Host Shop.', image: '/images/pages/barber-shop-interior.webp' },
    { href: '/host-shop/dashboard/competencies', title: 'Competency sign-offs', value: progressValue, detail: progressDetail, image: '/images/pages/shop-hero.webp' },
    { href: '/host-shop/dashboard/documents', title: 'Required documents', value: board.requiredDocumentCount ? `${board.acceptedDocumentCount}/${board.requiredDocumentCount}` : board.partner?.documents_verified ? 'Complete' : 'Review', detail: 'Maintain MOU, licenses, insurance, payroll evidence, and required Host Shop records.', image: '/images/pages/comp-home-highlight-success.webp' },
  ];
  const toolCards: PortalCard[] = [
    { href: '/host-shop/orientation', title: 'Required orientation', detail: 'Learn Appendix A, recruiting, economics, payroll, WIOA, geofencing, work approval, competencies, transfer-credit rules, and compliance.', image: '/images/pages/training-classroom.webp' },
    { href: '/host-shop/dashboard/match-requests', title: 'Match requests', detail: 'Review apprentice placement requests for your shop.', image: '/images/pages/admin-employers-hero.webp' },
    { href: '/host-shop/dashboard/attendance/record', title: 'Record attendance', detail: 'Record attendance against the active apprentice placement.', image: '/images/pages/training-classroom.webp' },
    { href: '/host-shop/dashboard/reports', title: 'Reporting center', detail: 'Review documented work, competencies, attendance, and compliance records.', image: '/images/heroes/lms-analytics.webp' },
    { href: '/host-shop/dashboard/profile', title: 'Shop profile', detail: 'Maintain the approved shop profile and operating information.', image: '/images/pages/business-meeting.webp' },
  ];

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="grid lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch"><div className="p-6 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">Host Shop</p><h1 className="mt-2 text-3xl font-black text-slate-950">{board.partner?.name || board.shops[0]?.name || 'Host Shop Board'}</h1><p className="mt-2 font-medium text-slate-700">{board.tradeInfo.label}</p>{competencyBased ? <p className="mt-1 text-sm font-bold text-cyan-800">Competency-based · {board.tradeInfo.competencyCount ?? 14} competencies · {board.tradeInfo.rtiHours ?? 260} RTI hours</p> : null}{board.shops[0]?.city ? <p className="mt-1 text-sm font-medium text-slate-700">{board.shops[0].city}, {board.shops[0].state}</p> : null}</div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-bold ${board.partner?.approval_status === 'approved' ? 'bg-green-100 text-green-900' : 'bg-amber-100 text-amber-900'}`}>{board.partner?.approval_status === 'approved' ? 'Approved Partner' : 'Pending Approval'}</span><span className={`rounded-full px-3 py-1 text-xs font-bold ${board.partner?.mou_signed ? 'bg-green-100 text-green-900' : 'bg-amber-100 text-amber-900'}`}>MOU {board.partner?.mou_signed ? 'Signed' : 'Pending'}</span>{isPlatformAdmin ? <form action={clearAdminPartner}><button className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-bold">Change Host Shop</button></form> : null}</div></div></div><div className="relative min-h-[240px]"><Image src="/images/pages/barber-training.webp" alt="Host Shop supervised apprenticeship training" fill priority className="object-cover" sizes="(max-width: 1024px) 100vw, 42vw" /></div></div></section>
    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{summaryCards.map((card) => <PortalImageCard key={card.title} card={card} />)}</section>
    {!board.partner?.onboarding_completed ? <section className="mt-6 rounded-2xl border-2 border-amber-300 bg-amber-50 p-5"><h2 className="font-black text-amber-950">Required Host Shop orientation</h2><p className="mt-1 text-sm font-medium text-amber-950">Complete the operating orientation before independently managing apprentice work records, competencies, payroll documentation, and compliance.</p><Link href="/host-shop/orientation" className="mt-4 inline-flex rounded-lg bg-amber-800 px-4 py-2 text-sm font-black text-white">Start required orientation</Link></section> : null}
    {(board.missingDocuments.length > 0 || board.pendingDocuments.length > 0 || !board.partner?.onboarding_completed) ? <section className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-5"><h2 className="font-black text-amber-950">Host-site onboarding requires attention</h2><p className="mt-1 text-sm font-medium text-amber-950">{board.missingDocuments.length} required document(s) missing · {board.pendingDocuments.length} in review.</p><div className="mt-4 flex flex-wrap gap-2">{!isPlatformAdmin && !board.partner?.mou_signed ? <Link href={board.onboardingPaths.signMou} className="rounded-lg bg-amber-800 px-4 py-2 text-sm font-bold text-white">Sign MOU</Link> : null}{!isPlatformAdmin && !board.partner?.onboarding_completed ? <Link href={board.onboardingPaths.forms} className="rounded-lg border border-amber-400 bg-white px-4 py-2 text-sm font-bold text-amber-950">Finish onboarding</Link> : null}<Link href={board.onboardingPaths.documents} className="rounded-lg border border-amber-400 bg-white px-4 py-2 text-sm font-bold text-amber-950">Documents</Link></div></section> : null}
    <section className="mt-8"><h2 className="text-2xl font-black text-slate-950">Host Shop tools</h2><p className="mt-1 text-sm font-medium text-slate-700">Operational workspaces use the approved partner, shop, apprentice placement, Appendix A, and audit records for this account.</p><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{toolCards.map((card) => <PortalImageCard key={card.title} card={card} />)}</div></section>
  </main>;
}
