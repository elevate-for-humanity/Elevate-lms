import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  GraduationCap, BookOpen, Award, CheckCircle2,
  ArrowLeft, Clock, BarChart3,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Student Progress | Parent Portal | Elevate For Humanity',
};

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default async function ParentStudentDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?redirect=/parent-portal/student/${studentId}`);
  }

  // Verify the requesting user is linked to this student
  const { data: link } = await supabase
    .from('parent_student_links')
    .select('relationship, verified')
    .eq('parent_id', user.id)
    .eq('student_id', studentId)
    .maybeSingle();

  if (!link) {
    // Not linked — check if admin/super_admin can view
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
      notFound();
    }
  }

  // Fetch student profile
  const { data: student } = await supabase
    .from('profiles')
    .select('full_name, email, created_at')
    .eq('id', studentId)
    .single();

  if (!student) notFound();

  // Fetch enrollments with program info
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select(`
      id, status, progress_percent, enrolled_at, completed_at,
      programs ( id, title, slug )
    `)
    .eq('user_id', studentId)
    .order('enrolled_at', { ascending: false });

  // Fetch lesson progress counts per enrollment
  const enrollmentIds = (enrollments ?? []).map((e: any) => e.id);
  const { data: lessonProgress } = enrollmentIds.length > 0
    ? await supabase
        .from('lesson_progress')
        .select('enrollment_id, completed')
        .in('enrollment_id', enrollmentIds)
    : { data: [] };

  // Aggregate lesson counts
  const progressByEnrollment: Record<string, { total: number; completed: number }> = {};
  for (const lp of lessonProgress ?? []) {
    const eid = (lp as any).enrollment_id;
    if (!progressByEnrollment[eid]) progressByEnrollment[eid] = { total: 0, completed: 0 };
    progressByEnrollment[eid].total++;
    if ((lp as any).completed) progressByEnrollment[eid].completed++;
  }

  // Fetch certificates
  const { data: certificates } = await supabase
    .from('program_completion_certificates')
    .select('id, issued_at, programs(title)')
    .eq('user_id', studentId)
    .order('issued_at', { ascending: false });

  const activeEnrollments    = (enrollments ?? []).filter((e: any) => e.status === 'active');
  const completedEnrollments = (enrollments ?? []).filter((e: any) => e.status === 'completed');

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <Breadcrumbs items={[
          { label: 'Parent Portal',  href: '/parent-portal' },
          { label: 'Dashboard',      href: '/parent-portal/dashboard' },
          { label: student.full_name ?? 'Student' },
        ]} />
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-20">

        {/* Student header */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900">{student.full_name}</h1>
            <p className="text-slate-400 text-sm mt-0.5">Student since {fmtDate(student.created_at)}</p>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: 'Active Programs',    value: activeEnrollments.length,    icon: BookOpen },
            { label: 'Completed Programs', value: completedEnrollments.length, icon: CheckCircle2 },
            { label: 'Certificates',       value: (certificates ?? []).length, icon: Award },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white px-4 py-5 text-center">
              <Icon className="w-5 h-5 text-slate-400 mx-auto mb-2" />
              <p className="text-2xl font-black text-slate-900 tabular-nums">{value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Active enrollments */}
        {activeEnrollments.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" /> Active Programs
            </h2>
            <div className="space-y-4">
              {activeEnrollments.map((enr: any) => {
                const lp = progressByEnrollment[enr.id] ?? { total: 0, completed: 0 };
                return (
                  <div key={enr.id} className="rounded-xl border border-slate-200 bg-white px-6 py-5">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <p className="font-bold text-slate-900">{enr.programs?.title ?? 'Program'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Enrolled {fmtDate(enr.enrolled_at)}</p>
                      </div>
                      <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700">
                        Active
                      </span>
                    </div>
                    {/* Progress */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-blue-500 transition-all"
                          style={{ width: `${enr.progress_percent ?? 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold tabular-nums text-slate-600 flex-shrink-0 w-12 text-right">
                        {enr.progress_percent ?? 0}%
                      </span>
                    </div>
                    {lp.total > 0 && (
                      <p className="text-xs text-slate-400">
                        {lp.completed} of {lp.total} lessons completed
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Completed enrollments */}
        {completedEnrollments.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Completed Programs
            </h2>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
              {completedEnrollments.map((enr: any) => (
                <div key={enr.id} className="flex items-center gap-4 px-6 py-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{enr.programs?.title ?? 'Program'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Completed {fmtDate(enr.completed_at ?? enr.enrolled_at)}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                    100%
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Certificates */}
        {(certificates ?? []).length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" /> Certificates Earned
            </h2>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white overflow-hidden">
              {(certificates ?? []).map((cert: any) => (
                <div key={cert.id} className="flex items-center gap-4 px-6 py-4">
                  <Award className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      {(cert.programs as any)?.title ?? 'Certificate'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">Issued {fmtDate(cert.issued_at)}</p>
                  </div>
                  <Link
                    href={`/verify/${cert.id}`}
                    className="flex-shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Verify →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}

        {enrollments?.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <Clock className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No enrollment records found for this student yet.</p>
          </div>
        )}

        <Link
          href="/parent-portal/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700 mt-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
      </div>
    </div>
  );
}
