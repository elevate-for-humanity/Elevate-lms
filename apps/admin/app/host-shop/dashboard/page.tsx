import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BookOpen, Clock, CheckCircle, AlertCircle, Users, ArrowRight, Store, BadgeDollarSign } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { DOLCompetencyTracker } from '@/components/dashboard/DOLCompetencyTracker';

export const metadata: Metadata = {
  title: 'Host Shop Dashboard | Elevate',
  description: 'Manage apprentices, OJT hours, compliance, and host shop activity.',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

type ApprenticeProgress = {
  id: string;
  name: string;
  email: string;
  program: string;
  program_slug: string;
  ojt_hours: number;
  ojt_required: number;
  completion_percentage: number;
  status: string;
  user_id: string;
  enrollment_id: string;
};

async function getHostShopData(userId: string) {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, organization_id, full_name, organizations(name)')
    .eq('id', userId)
    .maybeSingle();

  if (!profile || !['host_shop', 'host_shop_admin', 'partner', 'admin', 'super_admin'].includes(String(profile.role))) return null;
  const orgId = profile.organization_id;

  const { data: enrollmentRows } = orgId
    ? await supabase
        .from('program_enrollments')
        .select('id, user_id, status, created_at, updated_at, profiles:user_id(full_name,email), programs:program_id(id,title,slug,ojt_hours_required,rti_hours_required)')
        .eq('host_shop_id', orgId)
        .in('status', ['active', 'enrolled', 'paused'])
    : { data: [] as any[] };

  const { data: ojtRows } = orgId
    ? await supabase.from('ojt_hours').select('user_id, hours').eq('host_shop_id', orgId)
    : { data: [] as any[] };

  const ojtByUser: Record<string, number> = {};
  for (const row of (ojtRows ?? []) as any[]) {
    if (!row?.user_id) continue;
    ojtByUser[row.user_id] = (ojtByUser[row.user_id] || 0) + Number(row.hours || 0);
  }

  const apprentices: ApprenticeProgress[] = ((enrollmentRows ?? []) as any[]).map((row) => {
    const profileRow = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    const programRow = Array.isArray(row.programs) ? row.programs[0] : row.programs;
    const required = Number(programRow?.ojt_hours_required || 2000);
    const completed = Number(ojtByUser[row.user_id] || 0);
    return {
      id: String(row.id),
      name: profileRow?.full_name || 'Apprentice',
      email: profileRow?.email || '',
      program: programRow?.title || 'Apprenticeship',
      program_slug: programRow?.slug || 'barber-apprenticeship',
      ojt_hours: completed,
      ojt_required: required,
      completion_percentage: required > 0 ? Math.min(100, Math.round((completed / required) * 100)) : 0,
      status: row.status || 'active',
      user_id: row.user_id,
      enrollment_id: row.id,
    };
  });

  const { data: wotcCredits } = orgId
    ? await supabase.from('wotc_credits').select('id, status, amount').eq('host_shop_id', orgId).in('status', ['pending', 'approved'])
    : { data: [] as any[] };

  return { profile, apprentices, wotcCredits: (wotcCredits ?? []) as any[] };
}

export default async function HostShopDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/host-shop/dashboard');

  const data = await getHostShopData(user.id);
  if (!data) redirect('/unauthorized');

  const { profile, apprentices, wotcCredits } = data;
  const org = Array.isArray((profile as any).organizations) ? (profile as any).organizations[0] : (profile as any).organizations;
  const shopName = org?.name || profile.full_name || 'Your Host Shop';
  const totalOjt = apprentices.reduce((sum, apprentice) => sum + apprentice.ojt_hours, 0);
  const approvedWotc = wotcCredits.filter((credit) => credit.status === 'approved').reduce((sum, credit) => sum + Number(credit.amount || 0), 0);
  const selected = apprentices[0];

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="relative isolate overflow-hidden px-6 py-10 text-white">
        <Image src="/images/pages/barber-apprenticeship-hero.jpg" alt="Barber apprenticeship host shop" fill priority className="-z-20 object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-emerald-900/60" />
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-emerald-200"><Store className="h-5 w-5" />Host Shop Portal</div>
          <h1 className="mt-3 text-3xl font-black sm:text-4xl">{shopName}</h1>
          <p className="mt-3 max-w-2xl text-sm font-medium text-slate-100">Supervise apprentices, approve OJT activity, review DOL competencies, and keep your shop’s apprenticeship records current.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/host-shop/ojt" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-slate-950">Log OJT Hours <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/host-shop/apprentices" className="rounded-xl bg-white/15 px-4 py-2.5 text-sm font-black text-white ring-1 ring-white/30">View Apprentices</Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-7 px-6 py-7">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Active apprentices', apprentices.length, Users, 'text-blue-700 bg-blue-50'],
            ['OJT hours logged', totalOjt, Clock, 'text-emerald-700 bg-emerald-50'],
            ['WOTC credits', `$${approvedWotc.toLocaleString()}`, BadgeDollarSign, 'text-amber-700 bg-amber-50'],
            ['Completed', apprentices.filter((a) => a.completion_percentage >= 100).length, CheckCircle, 'text-violet-700 bg-violet-50'],
          ].map(([label, value, Icon, tone]) => {
            const CardIcon = Icon as typeof Users;
            return <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className={`inline-flex rounded-xl p-2.5 ${String(tone)}`}><CardIcon className="h-5 w-5" /></div><div className="mt-4 text-2xl font-black text-slate-950">{String(value)}</div><div className="mt-1 text-xs font-black uppercase tracking-wide text-slate-500">{String(label)}</div></div>;
          })}
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2"><BookOpen className="h-5 w-5 text-blue-700" /><h2 className="text-lg font-black text-slate-950">Apprentice progress</h2></div>
            <div className="mt-4 space-y-3">
              {apprentices.length ? apprentices.map((apprentice) => <div key={apprentice.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center justify-between gap-4"><div><div className="font-black text-slate-950">{apprentice.name}</div><div className="mt-1 text-xs font-semibold text-slate-500">{apprentice.program} · {apprentice.ojt_hours}/{apprentice.ojt_required} OJT hours</div></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-700">{apprentice.completion_percentage}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${apprentice.completion_percentage}%` }} /></div></div>) : <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm font-semibold text-slate-500">No active apprentices assigned to this shop yet.</div>}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5"><div className="flex items-center gap-2 font-black text-blue-950"><AlertCircle className="h-5 w-5" />What to do next</div><ol className="mt-3 space-y-2 text-sm font-medium text-blue-950"><li>1. Log hours after supervised work.</li><li>2. Verify competencies only after demonstration.</li><li>3. Review apprentices who are behind schedule.</li><li>4. Keep compliance records current before reporting.</li></ol></div>
            <div className="grid gap-2">
              <Link href="/host-shop/compliance" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm">DOL Compliance</Link>
              <Link href="/host-shop/reports" className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 shadow-sm">Progress Reports</Link>
            </div>
          </aside>
        </section>

        {selected && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-slate-950">DOL Competency Tracker — {selected.name}</h2>
            <DOLCompetencyTracker
              userId={selected.user_id || user.id}
              programSlug={selected.program_slug || 'barber-apprenticeship'}
              isHostShop
              enrollmentId={selected.enrollment_id}
            />
          </section>
        )}
      </div>
    </main>
  );
}
