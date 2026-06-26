import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { BookOpen, Users, CheckCircle, TrendingUp, ChevronRight, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Learning Analytics | Admin',
};

export default async function LearningAnalyticsPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();

  const [
    totalCoursesRes,
    totalEnrollmentsRes,
    completedEnrollmentsRes,
    completedLessonsRes,
    totalLessonsRes,
    recentProgressRes,
    certsRes,
  ] = await Promise.all([
    db.from('programs').select('id', { count: 'exact', head: true }).eq('is_active', true),
    db.from('program_enrollments').select('id', { count: 'exact', head: true }),
    db
      .from('program_enrollments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'completed'),
    db.from('lesson_progress').select('id', { count: 'exact', head: true }).eq('completed', true),
    db.from('lesson_progress').select('id', { count: 'exact', head: true }),
    db
      .from('lesson_progress')
      .select('id, user_id, completed, completed_at, course_id, progress_percent')
      .eq('completed', true)
      .order('completed_at', { ascending: false })
      .limit(20),
    db.from('program_completion_certificates').select('id', { count: 'exact', head: true }),
  ]);

  const totalCourses = totalCoursesRes.count ?? 0;
  const totalEnrollments = totalEnrollmentsRes.count ?? 0;
  const completedEnroll = completedEnrollmentsRes.count ?? 0;
  const completedLessons = completedLessonsRes.count ?? 0;
  const totalLessons = totalLessonsRes.count ?? 0;
  const recentProgress = recentProgressRes.data ?? [];
  const totalCerts = certsRes.count ?? 0;

  const completionRate =
    totalEnrollments > 0 ? Math.round((completedEnroll / totalEnrollments) * 100) : 0;
  const lessonRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Hydrate user profiles for recent progress
  const userIds = [...new Set(recentProgress.map((p: any) => p.user_id).filter(Boolean))];
  const { data: profiles } = userIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map((p: any) => [p.id, p]));

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">
            Admin
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/analytics" className="hover:text-slate-700">
            Analytics
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Learning</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Learning Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          Course completions, lesson progress, and certificate issuance
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Active Programs',
              value: totalCourses,
              icon: BookOpen,
              color: 'text-brand-blue-600',
              bg: 'bg-brand-blue-50',
            },
            {
              label: 'Total Enrollments',
              value: totalEnrollments,
              icon: Users,
              color: 'text-purple-600',
              bg: 'bg-purple-50',
            },
            {
              label: 'Completion Rate',
              value: `${completionRate}%`,
              icon: TrendingUp,
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
            {
              label: 'Certificates Issued',
              value: totalCerts,
              icon: CheckCircle,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
              >
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Lesson completion bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-900 text-sm">Lesson Completion</h2>
            <span className="text-sm font-bold text-slate-700">
              {completedLessons} / {totalLessons} lessons
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3">
            <div
              className="bg-brand-blue-500 h-3 rounded-full transition-all"
              style={{ width: `${lessonRate}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {lessonRate}% of all lesson progress records marked complete
          </p>
        </div>

        {/* Recent completions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">Recent Lesson Completions</h2>
            <Link
              href="/admin/students"
              className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1"
            >
              All students <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentProgress.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No lesson completions recorded yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Student', 'Progress', 'Completed'].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recentProgress.map((p: any) => {
                  const profile = profileMap[p.user_id];
                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{profile?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{profile?.email ?? ''}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        {p.progress_percent != null && (
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-slate-100 rounded-full h-1.5">
                              <div
                                className="bg-green-500 h-1.5 rounded-full"
                                style={{ width: `${p.progress_percent}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500">{p.progress_percent}%</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 text-xs">
                        {p.completed_at ? new Date(p.completed_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
