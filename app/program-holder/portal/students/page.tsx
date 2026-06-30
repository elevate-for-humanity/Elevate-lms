import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';
import { Users, GraduationCap, TrendingUp, Award, ChevronRight, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Students | Program Holder Portal',
  robots: { index: false, follow: false },
};

export default async function PortalStudentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/program-holder/portal/students');

  const db = await requireAdminClient();
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!['program_holder', 'admin', 'super_admin', 'instructor'].includes(profile?.role ?? ''))
    redirect('/portals');

  // Resolve holderId to scope all queries to this holder's students only
  const { holderId } = await requireProgramHolder();

  const [
    { data: enrollments, count: totalCount },
    { count: activeCount },
    { count: completedCount },
  ] = await Promise.all([
    db
      .from('program_enrollments')
      .select(
        'id, status, enrolled_at, progress_percentage, programs(title), profiles(full_name, email)',
        { count: 'exact' },
      )
      .eq('program_holder_id', holderId)
      .order('enrolled_at', { ascending: false })
      .limit(25),
    db
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('program_holder_id', holderId)
      .eq('status', 'active'),
    db
      .from('program_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('program_holder_id', holderId)
      .eq('status', 'completed'),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-0.5">
            Program Holder Portal
          </p>
          <h1 className="text-xl font-bold text-slate-900">Students</h1>
        </div>
        <Link
          href="/program-holder/portal"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Portal
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-5 mb-8">
          {[
            {
              label: 'Total Students',
              value: totalCount ?? 0,
              icon: Users,
              color: 'text-blue-500',
            },
            { label: 'Active', value: activeCount ?? 0, icon: TrendingUp, color: 'text-brand-green-500' },
            {
              label: 'Completed',
              value: completedCount ?? 0,
              icon: Award,
              color: 'text-purple-500',
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5">
                <Icon className={`w-5 h-5 ${s.color} mb-3`} />
                <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900">Enrolled Students</h2>
          </div>
          {!enrollments?.length ? (
            <div className="px-6 py-16 text-center text-slate-400 text-sm">
              No students enrolled yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {enrollments.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {e.profiles?.full_name ?? 'Student'}
                    </p>
                    <p className="text-xs text-slate-400">{e.profiles?.email ?? ''}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {e.programs?.title ?? 'Program'}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {e.progress_percentage != null && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{e.progress_percentage}%</p>
                        <p className="text-xs text-slate-400">progress</p>
                      </div>
                    )}
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        e.status === 'active'
                          ? 'bg-brand-green-50 text-brand-green-700'
                          : e.status === 'completed'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {e.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
