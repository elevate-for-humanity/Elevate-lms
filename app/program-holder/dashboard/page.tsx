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
          .select('id, program_id, progress', { count: 'exact' })
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
          .select('id, enrolled_at, status, progress, program_id, profiles!program_enrollments_user_id_fkey(full_name), programs!program_enrollments_program_id_fkey(name, title)')
          .in('program_id', programIds)
          .order('enrolled_at', { ascending: false })
          .limit(5)
      : Promise.resolve({ data: [] }),

    programIds.length > 0
      ? db.from('payments')
          .select('amount_cents')
          .in('program_id', programIds)
          .eq('status', 'paid')
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

  const recentLearners = (recentLearnersRes.data ?? []).map((e: any) => ({
    id: e.id,
    name: e.profiles?.full_name ?? 'Learner',
    program: e.programs?.name ?? e.programs?.title ?? 'Program',
    progress: e.progress ?? 0,
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

      <div className="relative h-48 sm:h-56 w-full overflow-hidden">
        <Image src="/images/pages/workforce-training.jpg" alt="Program Holder Portal" fill className="object-cover object-center" priority sizes="100vw" />
        <div className="absolute inset-0 bg-slate-900/50 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full flex items-center justify-between">
            <div>
              <p className="text-brand-orange-400 text-xs font-bold uppercase tracking-widest mb-1">Elevate For Humanity</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Program Holder Portal</h1>
            </div>
            <Link href="/program-holder/settings" className="p-2 text-white/70 hover:text-white transition">
              <Settings className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-sm text-slate-500 mt-0.5">{stat.label}</p>
            </div>
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
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold text-slate-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {[
                  { label: 'Add New Program', href: '/program-holder/programs', icon: BookOpen, highlight: true },
                  { label: 'Manage Students', href: '/program-holder/students', icon: Users },
                  { label: 'View Reports', href: '/program-holder/reports', icon: BarChart3 },
                  { label: 'Payroll & Payouts', href: '/program-holder/payroll', icon: DollarSign },
                  { label: 'Analytics', href: '/program-holder/analytics', icon: TrendingUp },
                  { label: 'Settings', href: '/program-holder/settings', icon: Settings },
                ].map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`flex items-center justify-between p-3 rounded-lg text-sm transition-colors ${action.highlight ? 'bg-brand-blue-600 text-white hover:bg-brand-blue-700' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                  >
                    <div className="flex items-center gap-2">
                      <action.icon className="w-4 h-4" />
                      {action.label}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-60" />
                  </Link>
                ))}
              </div>
            </div>

            {programs.filter(p => !p.isActive).length > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
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
