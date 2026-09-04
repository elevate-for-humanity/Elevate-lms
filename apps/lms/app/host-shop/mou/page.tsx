import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import HostShopMouPreview from '@/components/partners/HostShopMouPreview';
import type { HostShopMouProgram } from '@/lib/partners/host-shop-mou-sections';
import HostShopMouSignForm from './HostShopMouSignForm';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';

export const dynamic = 'force-dynamic';

function normalizeProgram(value: unknown): HostShopMouProgram | null {
  const raw = String(value || '').trim().toLowerCase();
  if (raw.includes('barber')) return 'barber';
  if (raw.includes('cosmet')) return 'cosmetology';
  if (raw.includes('esthet')) return 'esthetician';
  if (raw.includes('nail')) return 'nail';
  return null;
}

export default async function HostShopMouPage({ searchParams }: { searchParams: Promise<{ program?: string }> }) {
  await requireRole(HOST_SHOP_ROLES);
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/host-shop/login?redirect=/host-shop/mou');

  const db = await requireAdminClient();
  const { data: link } = await db.from('partner_users')
    .select('partner_id, partners(id, name, program_type, programs, mou_signed)')
    .eq('user_id', user.id).eq('status', 'active').maybeSingle();
  if (!link?.partner_id || !link.partners) redirect('/unauthorized');

  const partner = link.partners as any;
  const params = await searchParams;
  const configured = [normalizeProgram(partner.program_type), ...(Array.isArray(partner.programs) ? partner.programs.map(normalizeProgram) : [])]
    .filter((value): value is HostShopMouProgram => Boolean(value));
  const requested = normalizeProgram(params.program);
  const program = requested && (configured.length === 0 || configured.includes(requested)) ? requested : configured[0] || 'barber';

  const { data: existingSignature } = await db.from('mou_signatures').select('id, signed_at')
    .eq('user_id', user.id).eq('partner_type', program).eq('organization_name', partner.name || '')
    .order('signed_at', { ascending: false }).limit(1).maybeSingle();

  return <main className="min-h-screen bg-slate-50 py-8"><div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-extrabold uppercase tracking-[0.12em] text-brand-red-700">Host Shop Partnership</p><h1 className="mt-1 text-3xl font-black text-slate-950">Memorandum of Understanding</h1><p className="mt-2 text-slate-600">{partner.name || 'Host Shop'} · {program.replace(/\b\w/g, (letter: string) => letter.toUpperCase())}</p></div><Link href="/host-shop/dashboard" className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">Back to dashboard</Link></div>
    {configured.length > 1 && <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4">{configured.map((item) => <Link key={item} href={`/host-shop/mou?program=${encodeURIComponent(item)}`} className={`rounded-full px-3 py-1.5 text-sm font-bold ${item === program ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-800'}`}>{item.replace(/\b\w/g, (letter: string) => letter.toUpperCase())}</Link>)}</div>}
    <HostShopMouPreview program={program} />
    <HostShopMouSignForm program={program} alreadySigned={Boolean(existingSignature)} />
  </div></main>;
}
