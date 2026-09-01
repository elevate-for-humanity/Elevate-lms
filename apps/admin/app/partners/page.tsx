import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle2, CircleAlert, ExternalLink } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireAdminClient } from '@/lib/supabase/admin';
import { mergeHostShopDocumentRequirements, resolveHostShopProgram } from '@/lib/partners/host-shop-onboarding';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  alternates: { canonical: 'https://admin.elevateforhumanity.org/partners' },
  title: 'Admin Partners | Elevate For Humanity',
  description: 'Manage training provider partnerships and Host Shop readiness.',
};

const ACCEPTED_DOCUMENT_STATUSES = new Set(['accepted', 'approved', 'verified', 'complete', 'completed']);

function isProductionRecord(item: any) {
  const identity = `${item.name || ''} ${item.contact_email || ''}`.toLowerCase();
  return !/(\[qa|qa e2e|test@|@test\.|@example\.|\.invalid|ffff|gggg|qwfh|gert|fvsdf)/.test(identity);
}

function isApprovedHostShop(partner: any) {
  const typeText = [partner.partner_type, partner.program_type, ...(Array.isArray(partner.programs) ? partner.programs : [])].filter(Boolean).join(' ').toLowerCase();
  return partner.status === 'active' && partner.approval_status === 'approved' && partner.is_active !== false && /(barber|cosmet|nail|esthetic|salon|shop|training_site)/.test(typeText);
}

export default async function PartnersPage() {
  await requireRole(['super_admin', 'admin']);
  const supabase = await requireAdminClient();
  const [{ data: items }, { count: pendingApplications }] = await Promise.all([
    supabase.from('partners').select('*').order('created_at', { ascending: false }),
    supabase.from('partner_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const productionItems = (items || []).filter(isProductionRecord);
  const activePartners = productionItems.filter((item: any) => item.status === 'active');
  const hostShopPartners = productionItems.filter(isApprovedHostShop);
  const hostShopIds = hostShopPartners.map((partner: any) => partner.id);
  const [{ data: hostDocuments }, { data: hostUsers }, { data: canonicalShops }, { data: requirementRows }] = hostShopIds.length
    ? await Promise.all([
        supabase.from('partner_documents').select('partner_id,document_type,status,uploaded_at').in('partner_id', hostShopIds),
        supabase.from('partner_users').select('partner_id,user_id,status').in('partner_id', hostShopIds).eq('status', 'active'),
        supabase.from('shops').select('id,partner_id,name,active').in('partner_id', hostShopIds).neq('active', false),
        supabase.from('partner_document_requirements').select('*'),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }];

  const hostReadiness = hostShopPartners.map((partner: any) => {
    const program = resolveHostShopProgram(partner);
    const requirements = mergeHostShopDocumentRequirements(
      (requirementRows || []).filter((row: any) => ['ALL', program].includes(row.program_id) && ['ALL', partner.state || 'Indiana'].includes(row.state)),
      program,
    ).filter((row: any) => row.is_required);
    const latestByType = new Map<string, any>();
    const documents = (hostDocuments || []).filter((row: any) => row.partner_id === partner.id).sort((a: any, b: any) => String(b.uploaded_at || '').localeCompare(String(a.uploaded_at || '')));
    for (const document of documents) if (!latestByType.has(document.document_type)) latestByType.set(document.document_type, document);
    const missing = requirements.filter((requirement: any) => {
      const document = latestByType.get(requirement.document_type);
      return !document || !ACCEPTED_DOCUMENT_STATUSES.has(String(document.status || '').toLowerCase());
    });
    const linkedUsers = (hostUsers || []).filter((row: any) => row.partner_id === partner.id).length;
    const linkedShops = (canonicalShops || []).filter((row: any) => row.partner_id === partner.id).length;
    const complete = requirements.length > 0 && missing.length === 0 && partner.mou_signed === true && partner.onboarding_completed === true && linkedUsers > 0 && linkedShops > 0;
    return { partner, requirements, missing, linkedUsers, linkedShops, complete };
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-4"><Breadcrumbs items={[{ label: 'Admin', href: '/dashboard' }, { label: 'Partners' }]} /></div>
      <section className="relative h-48 overflow-hidden md:h-64"><Image src="/images/pages/admin-partners-detail.jpg" alt="Partners" fill className="object-cover" quality={90} priority sizes="100vw" /></section>
      <main className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-4">
          <Metric label="Production partners" value={productionItems.length} />
          <Metric label="Active" value={activePartners.length} />
          <Metric label="Approved Host Shops" value={hostReadiness.length} />
          <Metric label="Pending applications" value={pendingApplications || 0} />
        </div>
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 bg-slate-950 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
            <div><p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-300">Production source of truth</p><h1 className="mt-1 text-2xl font-black">Approved Host Shop readiness</h1><p className="mt-1 max-w-3xl text-sm text-slate-300">Completion is calculated from account links, canonical shop records, accepted documents, MOU, and onboarding. Database flags alone cannot mark a shop complete.</p></div>
            <Link href="https://app.elevateforhumanity.org/host-shop/dashboard" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-black text-slate-950 hover:bg-slate-100">Open Host Shop portal <ExternalLink className="h-4 w-4" /></Link>
          </div>
          <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase tracking-wide text-slate-700"><tr><th className="px-5 py-3">Host Shop</th><th className="px-5 py-3">Portal links</th><th className="px-5 py-3">Documents</th><th className="px-5 py-3">MOU</th><th className="px-5 py-3">Onboarding</th><th className="px-5 py-3">Readiness</th></tr></thead>
            <tbody className="divide-y divide-slate-200">{hostReadiness.map(({ partner, requirements, missing, linkedUsers, linkedShops, complete }: any) => (
              <tr key={partner.id} className={complete ? 'bg-white' : 'bg-red-50/40'}>
                <td className="px-5 py-4"><p className="font-black text-slate-950">{partner.name}</p><p className="mt-1 text-xs font-medium text-slate-600">{partner.contact_email || 'No contact email'}</p></td>
                <td className="px-5 py-4"><StatusLine ok={linkedUsers > 0}>{linkedUsers ? `${linkedUsers} account link${linkedUsers === 1 ? '' : 's'}` : 'Account link missing'}</StatusLine><StatusLine ok={linkedShops > 0}>{linkedShops ? `${linkedShops} shop record${linkedShops === 1 ? '' : 's'}` : 'Shop record missing'}</StatusLine></td>
                <td className="px-5 py-4"><p className="font-black text-slate-950">{requirements.length - missing.length}/{requirements.length} accepted</p>{missing.length ? <p className="mt-1 max-w-sm text-xs font-bold leading-5 text-red-800">Missing: {missing.map((item: any) => item.document_name).join(', ')}</p> : <p className="mt-1 text-xs font-bold text-green-800">All required documents accepted</p>}</td>
                <td className="px-5 py-4"><StatusLine ok={partner.mou_signed === true}>{partner.mou_signed ? 'Signed' : 'Missing'}</StatusLine></td>
                <td className="px-5 py-4"><StatusLine ok={partner.onboarding_completed === true}>{partner.onboarding_completed ? 'Complete' : `Incomplete${partner.onboarding_step ? ` — ${partner.onboarding_step}` : ''}`}</StatusLine></td>
                <td className="px-5 py-4">{complete ? <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 font-black text-green-900"><CheckCircle2 className="h-4 w-4" /> Ready</span> : <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 font-black text-red-900"><CircleAlert className="h-4 w-4" /> Action required</span>}</td>
              </tr>))}</tbody>
          </table></div>
        </section>
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-2xl font-black text-slate-950">Production partners</h2><p className="mt-1 text-sm text-slate-600">QA, placeholder, and invalid-email records are excluded from this operational view.</p><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{productionItems.map((item: any) => <div key={item.id} className="rounded-xl border border-slate-200 p-4"><p className="font-bold text-slate-950">{item.title || item.name || item.id}</p><p className="mt-1 text-xs font-medium text-slate-600">{item.status || 'No status'} · {new Date(item.created_at).toLocaleDateString()}</p></div>)}</div></section>
      </main>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm font-bold text-slate-600">{label}</p><p className="mt-1 text-3xl font-black text-brand-blue-700">{value}</p></div>;
}

function StatusLine({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <p className={`${ok ? 'text-green-800' : 'text-red-800'} mt-1 font-bold first:mt-0`}>{children}</p>;
}
