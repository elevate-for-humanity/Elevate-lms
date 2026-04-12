import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users, BookOpen, TrendingUp, BarChart3, DollarSign,
  Settings, Award, ChevronRight, AlertCircle,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const metadata: Metadata = {
  title: 'Program Holder Portal | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ProgramHolderDashboardPage() {
  const { db, programIds } = await requireProgramHolder();

  const [
    programsRes,
    enrollmentsRes,
    completedRes,
    certsRes,
    recentLearnersRes,
    paymentsRes,
  ] = await Promise.all([
    programIds.length > 0
      ? db.from('programs')
          .select('id, name, title, slug, is_active, status, created_at')
          .in('id', programIds)
          .order('created_at', { ascending: false })
      : Promise.resolve({ data: [] }),

    programIds.length > 0
      ? db.from('program_enrollments')
          .select('id, program_id, progress_percent', { count: 'exact' })
          .in('program_id', programIds)
          .eq('status', 'active')
      : Promise.resolve({ data: [], count: 0 }),

    programIds.length > 0
      ? db.from('program_enrollments')
          .select('id', { count: 'exact', head: true })
          .in('program_id', programIds)
          .eq('status', 'completed')
      : Promise.resolve({ count: 0 }),

    programIds.length > 0
      ? db.from('certificates')
          .select('id', { count: 'exact', head: true })
          .in('program_id', programIds)
      : Promise.resolve({ count: 0 }),

    programIds.length > 0
      ? db.from('program_enrollments')
          .select('id, enrolled_at, status, progress_percent, program_id, user_id, programs ( name, title )')
          .in('program_id', programIds)
          .order('enrolled_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),

    // Revenue: join payments → programs via program_slug
    programIds.length > 0
      ? db.from('programs')
          .select('slug')
          .in('id', programIds)
          .then(async ({ data: slugRows }) => {
            const slugs = (slugRows ?? []).map((r: any) => r.slug).filter(Boolean);
            if (slugs.length === 0) return { data: [] };
            return db.from('payments')
              .select('amount_cents')
              .in('program_slug', slugs)
              .eq('status', 'paid');
          })
      : Promise.resolve({ data: [] }),
  ]);

  const programs = (programsRes.data ?? []).map((p: any) => ({
    id: p.id,
    name: p.name || p.title || 'Untitled Program',
    slug: p.slug ?? '',
    isActive: p.is_active,
    status: p.status ?? 'draft',
  }));

  const enrollmentsByProgram: Record<string, number> = {};
  for (const e of (enrollmentsRes.data ?? [])) {
    if (e.program_id) {
      enrollmentsByProgram[e.program_id] = (enrollmentsByProgram[e.program_id] || 0) + 1;
    }
  }

  const totalActive = (enrollmentsRes as any).count ?? 0;
  const totalCompleted = (completedRes as any).count ?? 0;
  const totalCerts = (certsRes as any).count ?? 0;
  const totalRevenueCents = (paymentsRes.data ?? []).reduce((s: number, r: any) => s + Number(r.amount_cents ?? 0), 0);

  // Hydrate learner names — program_enrollments.user_id → auth.users, not profiles
  const learnerUserIds = [...new Set((recentLearnersRes.data ?? []).map((e: any) => e.user_id).filter(Boolean))];
  const { data: learnerProfiles } = learnerUserIds.length
    ? await db.from('profiles').select('id, full_name').in('id', learnerUserIds)
    : { data: [] };
  const learnerProfileMap = Object.fromEntries((learnerProfiles || []).map((p: any) => [p.id, p]));

  const recentLearners = (recentLearnersRes.data ?? []).map((e: any) => ({
    id: e.id,
    name: learnerProfileMap[e.user_id]?.full_name ?? 'Learner',
    program: (e.programs as any)?.name ?? (e.programs as any)?.title ?? 'Program',
    progress: e.progress_percent ?? 0,
    enrolledAt: e.enrolled_at,
  }));

  const stats = [
    { label: 'Active Learners', value: totalActive.toLocaleString(), icon: Users, color: 'text-brand-blue-600', bg: 'bg-brand-blue-100' },
    { label: 'Programs', value: programs.length.toString(), icon: BookOpen, color: 'text-brand-orange-600', bg: 'bg-brand-orange-100' },
    { label: 'Completions', value: totalCompleted.toLocaleString(), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Certificates Issued', value: totalCerts.toLocaleString(), icon: Award, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Breadcrumbs items={[{ label: 'Program Holder Dashboard' }]} />

      {/* Hero */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        <Image src="/images/pages/program-holder-page-1.jpg" alt="Program Holder Portal" fill className="object-cover object-center" priority sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-blue-950/90 via-brand-blue-900/50 to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto w-full px-6 pb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-brand-orange-400 text-xs font-bold uppercase tracking-widest mb-2">Elevate For Humanity</p>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight">Program Holder Portal</h1>
              <p className="text-slate-300 text-sm mt-2">Manage your programs, learners, and compliance from one place.</p>
            </div>
            <Link href="/program-holder/settings" className="flex-shrink-0 p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition">
              <Settings className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Stats — image-backed cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Active Learners',     value: totalActive.toLocaleString(),    img: '/images/pages/admin-students-hero.jpg',          href: '/program-holder/students' },
            { label: 'Programs',            value: programs.length.toString(),       img: '/images/pages/about-career-training.jpg',        href: '/program-holder/programs' },
            { label: 'Completions',         value: totalCompleted.toLocaleString(), img: '/images/pages/graduation-ceremony.jpg',           href: '/program-holder/reports' },
            { label: 'Certificates Issued', value: totalCerts.toLocaleString(),     img: '/images/pages/certificates-page-1.jpg',           href: '/program-holder/reports' },
          ].map((stat) => (
            <Link key={stat.label} href={stat.href} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative h-28 w-full">
                <Image src={stat.img} alt={stat.label} fill className="object-cover object-center group-hover:scale-105 transition-transform duration-300" sizes="(max-width:768px) 50vw, 25vw" />
                <div className="absolute inset-0 bg-brand-blue-950/50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-4xl font-black text-white drop-shadow-lg">{stat.value}</p>
                </div>
              </div>
              <div className="px-4 py-3">
                <p className="text-sm font-bold text-slate-800">{stat.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {totalRevenueCents > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-800">Total Revenue</p>
                <p className="text-xs text-green-600">Across all programs</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-green-800">
              ${(totalRevenueCents / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-900">Program Performance</h2>
                <Link href="/program-holder/programs" className="text-sm text-brand-blue-600 hover:underline">Manage →</Link>
              </div>
              {programs.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 border-b border-slate-100">
                      <th className="pb-3 font-medium">Program</th>
                      <th className="pb-3 font-medium text-center">Active Learners</th>
                      <th className="pb-3 font-medium text-center">Status</th>
                      <th className="pb-3 font-medium text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {programs.map((p) => (
                      <tr key={p.id}>
                        <td className="py-3">
                          <Link href={`/program-holder/programs/${p.id}`} className="font-medium text-slate-800 hover:text-brand-blue-600">
                            {p.name}
                          </Link>
                        </td>
                        <td className="py-3 text-center text-slate-600">{(enrollmentsByProgram[p.id] ?? 0).toLocaleString()}</td>
                        <td className="py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {p.isActive ? 'Active' : p.status}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <Link href={`/program-holder/programs/${p.id}`} className="text-brand-blue-600 hover:underline text-xs">View</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-10">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">No programs assigned yet.</p>
                  <Link href="/program-holder/programs" className="inline-block mt-3 text-sm text-brand-blue-600 hover:underline">Add a program →</Link>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-slate-900">Recent Learners</h2>
                <Link href="/program-holder/students" className="text-sm text-brand-blue-600 hover:underline">View all →</Link>
              </div>
              {recentLearners.length > 0 ? (
                <div className="space-y-3">
                  {recentLearners.map((l) => (
                    <div key={l.id} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 bg-brand-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-brand-blue-600 text-xs font-bold">{l.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-800 truncate">{l.name}</p>
                          <p className="text-xs text-slate-400 truncate">{l.program}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-blue-500 rounded-full" style={{ width: `${l.progress}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-8 text-right">{l.progress}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No learners enrolled yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {/* Image-backed quick action cards */}
            {[
              { label: 'Program Holder Handbook', sub: 'Policies, rules & requirements', href: '/program-holder/handbook',  img: '/images/pages/program-holder-page-2.jpg' },
              { label: 'Manage Students',         sub: 'View progress & enrollment',     href: '/program-holder/students',  img: '/images/pages/mentorship-page-1.jpg' },
              { label: 'View Reports',            sub: 'Compliance & performance',       href: '/program-holder/reports',   img: '/images/pages/admin-analytics-programs-hero.jpg' },
              { label: 'Documents',               sub: 'Licenses & compliance docs',     href: '/program-holder/documents', img: '/images/pages/program-holder-docs.jpg' },
            ].map((action) => (
              <Link key={action.href} href={action.href} className="group relative flex items-center gap-4 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="relative w-20 h-20 flex-shrink-0">
                  <Image src={action.img} alt={action.label} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="80px" />
                  <div className="absolute inset-0 bg-brand-blue-900/30" />
                </div>
                <div className="flex-1 py-3 pr-4">
                  <p className="font-bold text-slate-900 text-sm">{action.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{action.sub}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-blue-500 mr-3 transition-colors" />
              </Link>
            ))}

            {/* Add program CTA */}
            <Link href="/program-holder/programs" className="group relative flex items-center gap-4 bg-brand-blue-600 rounded-2xl overflow-hidden shadow-sm hover:bg-brand-blue-700 transition-colors">
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image src="/images/pages/about-career-training.jpg" alt="Add Program" fill className="object-cover opacity-40 group-hover:scale-105 transition-transform duration-300" sizes="80px" />
              </div>
              <div className="flex-1 py-3 pr-4">
                <p className="font-bold text-white text-sm">Add New Program</p>
                <p className="text-xs text-brand-blue-200 mt-0.5">Expand your offerings</p>
              </div>
              <ChevronRight className="w-4 h-4 text-white/60 mr-3" />
            </Link>

            {programs.filter(p => !p.isActive).length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-800">
                      {programs.filter(p => !p.isActive).length} inactive program{programs.filter(p => !p.isActive).length > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">Not visible to learners.</p>
                    <Link href="/program-holder/programs" className="text-xs text-amber-800 font-semibold hover:underline mt-1 inline-block">Review →</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
