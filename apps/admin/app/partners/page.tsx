import { resolveHostShopDocuments } from '@/lib/partners/host-shop-document-status';
import { hostShopOnboardingLabel } from '@/lib/partners/host-shop-onboarding-label';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, CircleAlert, ExternalLink } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resolveHostShopProgram } from '@/lib/partners/host-shop-onboarding';
import { isCurrentHostShopPartner } from '@/lib/partners/host-shop-directory';
import { OpenPortalPreviewButton } from '@/components/admin/OpenPortalPreviewButton';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  alternates: { canonical: 'https://admin.elevateforhumanity.org/partners' },
  title: 'Admin Partners | Elevate For Humanity',
  description: 'Manage training provider partnerships and Host Shop readiness.',
};

function isProductionRecord(item: any) {
  const identity = `${item.name || ''} ${item.contact_email || ''}`.toLowerCase();
  return !/(\[qa|qa e2e|test@|@test\.|@example\.|\.invalid|ffff|gggg|qwfh|gert|fvsdf)/.test(
    identity,
  );
}

export default async function PartnersPage() {
  await requireRole(['super_admin', 'admin']);
  const supabase = await requireAdminClient();
  const { data: items, error: partnerError } = await supabase
    .from('partners')
    .select('*')
    .order('created_at', { ascending: false });
  if (partnerError) throw new Error('PARTNER_DIRECTORY_UNAVAILABLE');

  const productionItems = (items || []).filter(isProductionRecord);
  const activePartners = productionItems.filter((item: any) => item.status === 'active');
  const hostShopPartners = productionItems.filter(isCurrentHostShopPartner);
  const hostShopIds = hostShopPartners.map((partner: any) => partner.id);
  const readinessResults = hostShopIds.length
    ? await Promise.all([
        supabase
          .from('partner_documents')
          .select('partner_id,document_type,status,uploaded_at,expiration_date')
          .in('partner_id', hostShopIds),
        supabase
          .from('partner_users')
          .select('partner_id,user_id,status')
          .in('partner_id', hostShopIds)
          .eq('status', 'active'),
        supabase
          .from('shops')
          .select('id,partner_id,name,active')
          .in('partner_id', hostShopIds)
          .neq('active', false),
        supabase.from('partner_document_requirements').select('*'),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
      ];
  if (readinessResults.some((result) => result.error))
    throw new Error('HOST_SHOP_READINESS_UNAVAILABLE');
  const [
    { data: hostDocuments },
    { data: hostUsers },
    { data: canonicalShops },
    { data: requirementRows },
  ] = readinessResults;

  const hostReadiness = hostShopPartners.map((partner: any) => {
    const program = resolveHostShopProgram(partner);
    const documentStatuses = resolveHostShopDocuments(
      program,
      partner.state,
      requirementRows || [],
      (hostDocuments || []).filter((row: any) => row.partner_id === partner.id),
    );
    const requirements = documentStatuses.filter((row: any) => row.is_required);
    const missing = requirements.filter((row: any) => row.status !== 'accepted');
    const linkedUsers = (hostUsers || []).filter(
      (row: any) => row.partner_id === partner.id,
    ).length;
    const linkedShops = (canonicalShops || []).filter(
      (row: any) => row.partner_id === partner.id,
    ).length;
    const previewUserId =
      (hostUsers || []).find((row: any) => row.partner_id === partner.id)?.user_id ?? null;
    const complete =
      partner.approval_status === 'approved' &&
      requirements.length > 0 &&
      missing.length === 0 &&
      partner.mou_signed === true &&
      partner.onboarding_completed === true &&
      linkedUsers > 0 &&
      linkedShops > 0;
    return {
      partner,
      program,
      requirements,
      missing,
      linkedUsers,
      linkedShops,
      previewUserId,
      complete,
    };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/dashboard' }, { label: 'Partners' }]} />
      </div>
      <section className="relative h-48 overflow-hidden md:h-64">
        <Image
          src="/images/pages/admin-partners-detail.jpg"
          alt="Partners"
          fill
          className="object-cover"
          quality={90}
          priority
          sizes="100vw"
        />
      </section>
      <main className="mx-auto max-w-7xl px-4 py-10">
        <nav
          aria-label="Portal preview directories"
          className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          <Link
            href="/partners"
            className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
          >
            Host Shops
          </Link>
          <Link
            href="/program-holders"
            className="rounded-xl px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-100"
          >
            Program Holders
          </Link>
          <Link
            href="/partners/vendors"
            className="rounded-xl px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-100"
          >
            Vendor Partnerships
          </Link>
          <Link
            href="/host-shop/apprentices"
            className="rounded-xl px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-100"
          >
            Apprentices
          </Link>
          <Link
            href="/students"
            className="rounded-xl px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-100"
          >
            Learners
          </Link>
        </nav>
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
          <Metric label="Current Host Shop records" value={hostShopPartners.length} />
          <Metric
            label="Host Shops ready"
            value={hostReadiness.filter((shop) => shop.complete).length}
          />
          <Metric
            label="Approved Host Shops"
            value={
              hostShopPartners.filter((partner) => partner.approval_status === 'approved').length
            }
          />
          <Metric
            label="Onboarding needs attention"
            value={hostReadiness.filter((shop) => !shop.complete).length}
          />
        </div>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">
                Production source of truth
              </p>
              <Link href="/host-shop-finance" className="mb-4 inline-flex min-h-11 items-center rounded-xl bg-blue-800 px-4 py-2 font-bold text-white">Review Host Shop finance requests</Link>
            <h1 className="mt-1 text-2xl font-black">Host Shop readiness and onboarding</h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-300">
                Completion is calculated from account links, canonical shop records, accepted
                documents, MOU, and onboarding. Database flags alone cannot mark a shop complete.
              </p>
            </div>
            <Link
              href="https://app.elevateforhumanity.org/host-shop/dashboard"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-slate-950 hover:bg-slate-100"
            >
              Open Host Shop portal <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[980px] table-fixed text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-700">
                <tr>
                  <th className="px-5 py-3">Host Shop</th>
                  <th className="px-5 py-3">Portal links</th>
                  <th className="px-5 py-3">Documents</th>
                  <th className="px-5 py-3">MOU</th>
                  <th className="px-5 py-3">Onboarding</th>
                  <th className="px-5 py-3">Readiness</th>
                  <th className="px-5 py-3">Dashboard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {hostReadiness.map(
                  ({
                    partner,
                    program,
                    requirements,
                    missing,
                    linkedUsers,
                    linkedShops,
                    previewUserId,
                    complete,
                  }: any) => (
                    <tr key={partner.id} className={complete ? 'bg-white' : 'bg-red-50/40'}>
                      <td className="px-5 py-4">
                        <p className="font-black text-slate-950">{partner.name}</p>
                        <p className="mt-1 text-xs font-medium text-slate-600">
                          {partner.contact_email || 'No contact email'}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <StatusLine ok={linkedUsers > 0}>
                          {linkedUsers
                            ? `${linkedUsers} account link${linkedUsers === 1 ? '' : 's'}`
                            : 'Account link missing'}
                        </StatusLine>
                        <StatusLine ok={linkedShops > 0}>
                          {linkedShops
                            ? `${linkedShops} shop record${linkedShops === 1 ? '' : 's'}`
                            : 'Shop record missing'}
                        </StatusLine>
                      </td>
                      <td className="px-5 py-4">
                        {requirements.length ? (
                          <>
                            <p className="font-black text-slate-950">
                              {requirements.length - missing.length}/{requirements.length} accepted
                            </p>
                            {missing.length ? (
                              <details className="mt-1 max-w-xs">
                                <summary className="cursor-pointer text-xs font-black text-red-800">
                                  {missing.length} item{missing.length === 1 ? '' : 's'} need review
                                </summary>
                                <ul className="mt-2 space-y-1 text-xs font-semibold leading-5 text-red-800">
                                  {missing.map((item: any) => (
                                    <li key={item.document_type} className="break-words">
                                      • {item.document_name}
                                    </li>
                                  ))}
                                </ul>
                              </details>
                            ) : (
                              <p className="mt-1 text-xs font-bold text-green-800">
                                All required documents accepted
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="max-w-sm text-xs font-bold leading-5 text-amber-800">
                            Requirements are not configured for {program}; readiness cannot be
                            calculated.
                          </p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <StatusLine ok={partner.mou_signed === true}>
                          {partner.mou_signed ? 'Signed' : 'Missing'}
                        </StatusLine>
                      </td>
                      <td className="px-5 py-4">
                        <StatusLine ok={partner.onboarding_completed === true}>
                          {hostShopOnboardingLabel(partner, requirements.length, missing.length)}
                        </StatusLine>
                      </td>
                      <td className="px-5 py-4">
                        {complete ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 font-black text-green-900">
                            <CheckCircle2 className="h-4 w-4" /> Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 font-black text-red-900">
                            <CircleAlert className="h-4 w-4" /> Action required
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {previewUserId ? (
                          <OpenPortalPreviewButton
                            targetUserId={previewUserId}
                            hostShopPartnerId={partner.id}
                            label="Open dashboard"
                            reason={`Admin review of Host Shop ${partner.id}`}
                          />
                        ) : (
                          <span className="text-xs font-bold text-amber-800">
                            Link an account first
                          </span>
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 p-3 lg:hidden">
            {hostReadiness.map(
              ({
                partner,
                program,
                requirements,
                missing,
                linkedUsers,
                linkedShops,
                previewUserId,
                complete,
              }: any) => (
                <article
                  key={partner.id}
                  className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words font-black text-slate-950">{partner.name}</p>
                      <p className="mt-1 break-all text-xs text-slate-600">
                        {partner.contact_email || 'No contact email'}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-black ${complete ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'}`}
                    >
                      {complete ? 'Ready' : 'Action required'}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <b>User account</b>
                      <br />
                      {linkedUsers ? 'Connected' : 'Missing'}
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <b>Host Shop record</b>
                      <br />
                      {linkedShops ? 'Connected' : 'Missing'}
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <b>Documents</b>
                      <br />
                      {requirements.length
                        ? `${requirements.length - missing.length}/${requirements.length} accepted`
                        : 'Not configured'}
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <b>MOU / onboarding</b>
                      <br />
                      {partner.mou_signed ? 'MOU signed' : 'MOU missing'} ·{' '}
                      {hostShopOnboardingLabel(partner, requirements.length, missing.length)}
                    </div>
                  </div>
                  {missing.length ? (
                    <details className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3">
                      <summary className="cursor-pointer text-xs font-black text-red-900">
                        {missing.length} requirement{missing.length === 1 ? '' : 's'} need review
                      </summary>
                      <ul className="mt-2 space-y-1 text-xs font-semibold text-red-800">
                        {missing.map((item: any) => (
                          <li key={item.document_type} className="break-words">
                            • {item.document_name}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                  <div className="mt-4">
                    {previewUserId ? (
                      <OpenPortalPreviewButton
                        targetUserId={previewUserId}
                        hostShopPartnerId={partner.id}
                        label="Open dashboard"
                        reason={`Admin review of Host Shop ${partner.id}`}
                      />
                    ) : (
                      <span className="text-xs font-bold text-amber-800">
                        Link a user account first
                      </span>
                    )}
                  </div>
                </article>
              ),
            )}
          </div>
        </section>
        <details className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <summary className="cursor-pointer text-xl font-black text-slate-950">
            All partner records — {productionItems.length} records, {activePartners.length} flagged
            active
          </summary>
          <p className="mt-3 text-sm text-slate-600">
            This broader directory includes employers, agencies, vendors and internal records. An
            active database flag does not establish a signed partnership or a ready Host Shop.
            Preloaded records require evidence review.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {productionItems.map((item: any) => (
              <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                <p className="font-bold text-slate-950">{item.title || item.name || item.id}</p>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  {item.partner_type || 'Unclassified'} · {item.status || 'No status'} ·{' '}
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
                {typeof item.notes === 'string' &&
                  item.notes
                    .split('\n')
                    .find((line: string) => line.startsWith('[Directory provenance]')) && (
                    <p className="mt-2 text-xs leading-5 text-slate-700">
                      {item.notes
                        .split('\n')
                        .find((line: string) => line.startsWith('[Directory provenance]'))}
                    </p>
                  )}
              </div>
            ))}
          </div>
        </details>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-600">{label}</p>
      <p className="mt-1 text-3xl font-black text-brand-blue-700">{value}</p>
    </div>
  );
}

function StatusLine({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p className={`${ok ? 'text-green-800' : 'text-red-800'} mt-1 font-bold first:mt-0`}>
      {children}
    </p>
  );
}
