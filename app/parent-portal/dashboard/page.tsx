import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  GraduationCap, ArrowRight, BookOpen, Award,
  Phone, Mail, AlertTriangle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Parent & Guardian Dashboard | Elevate For Humanity',
};

export default async function ParentDashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login?redirect=/parent-portal/dashboard');
  }

  // Verify role — parents have role 'parent' or 'guardian', or are any authenticated user
  // with a parent_student_links row. We allow any authenticated user to reach this page;
  // if they have no linked students the page shows the empty state.
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, email, role')
    .eq('id', user.id)
    .single();

  // Fetch linked students
  const { data: links } = await supabase
    .from('parent_student_links')
    .select('student_id, relationship, verified')
    .eq('parent_id', user.id)
    .limit(20);

  const studentIds = (links || []).map((l: any) => l.student_id).filter(Boolean);

  // Hydrate student profiles and enrollments in parallel
  const [{ data: studentProfiles }, { data: studentEnrollments }] = await Promise.all([
    studentIds.length
      ? supabase.from('profiles').select('id, full_name, email').in('id', studentIds)
      : Promise.resolve({ data: [] }),
    studentIds.length
      ? supabase
          .from('program_enrollments')
          .select('id, user_id, status, progress_percent, enrolled_at, programs ( title, slug )')
          .in('user_id', studentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap = Object.fromEntries((studentProfiles || []).map((p: any) => [p.id, p]));
  const enrollmentsByStudent: Record<string, any[]> = {};
  for (const e of studentEnrollments || []) {
    const uid = (e as any).user_id;
    if (!enrollmentsByStudent[uid]) enrollmentsByStudent[uid] = [];
    enrollmentsByStudent[uid].push(e);
  }

  const students = (links ?? []).map((row: any) => ({
    id:           row.student_id as string,
    fullName:     profileMap[row.student_id]?.full_name ?? 'Student',
    email:        profileMap[row.student_id]?.email ?? null,
    relationship: row.relationship ?? 'guardian',
    verified:     row.verified ?? false,
    enrollments:  (enrollmentsByStudent[row.student_id] ?? []).map((e: any) => ({
      id:              e.id,
      status:          e.status,
      progressPercent: e.progress_percent ?? 0,
      enrolledAt:      e.enrolled_at,
      programTitle:    (e.programs as any)?.title ?? 'Program',
      programSlug:     (e.programs as any)?.slug ?? '',
    })),
  }));

  const firstName = profile?.full_name?.split(' ')[0] ?? 'Guardian';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-40 sm:h-56 overflow-hidden">
        <Image
          src="/images/pages/about-career-training.jpg"
          alt=""
          fill
          className="object-cover object-center"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs items={[
          { label: 'Parent Portal', href: '/parent-portal' },
          { label: 'Dashboard' },
        ]} />
      </div>

      <div className="max-w-5xl mx-auto px-4 pb-20">
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 mb-2">
          Welcome, {firstName}
        </h1>
        <p className="text-slate-500 mb-10">
          Monitor your student&apos;s progress and stay connected with their training program.
        </p>

        {students.length === 0 ? (
          /* ── No linked students ── */
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-8 py-14 text-center max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-7 h-7 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-3">No students linked yet</h2>
            <p className="text-slate-500 text-sm mb-6 leading-relaxed">
              Your account isn&apos;t linked to any student records. Contact your student&apos;s
              program coordinator to request access.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="tel:3173143757"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
              >
                <Phone className="w-4 h-4" /> (317) 314-3757
              </a>
              <a
                href="mailto:info@elevateforhumanity.org"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-slate-200 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                <Mail className="w-4 h-4" /> Email Us
              </a>
            </div>
          </div>
        ) : (
          /* ── Student cards ── */
          <div className="space-y-8">
            {students.map(student => (
              <div key={student.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                {/* Student header */}
                <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-bold text-slate-900 truncate">{student.fullName}</p>
                    <p className="text-sm text-slate-400 capitalize">{student.relationship}</p>
                  </div>
                  {!student.verified && (
                    <span className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                      Pending verification
                    </span>
                  )}
                  <Link
                    href={`/parent-portal/student/${student.id}`}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Full view <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Enrollments */}
                {student.enrollments.length === 0 ? (
                  <div className="px-6 py-6 text-sm text-slate-400">No active enrollments found.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {student.enrollments.map(enr => (
                      <div key={enr.id} className="px-6 py-5">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-2 min-w-0">
                            <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span className="text-sm font-semibold text-slate-800 truncate">{enr.programTitle}</span>
                          </div>
                          <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                            enr.status === 'active'    ? 'bg-emerald-100 text-emerald-700' :
                            enr.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {enr.status}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-blue-500 transition-all"
                              style={{ width: `${enr.progressPercent}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold tabular-nums text-slate-500 flex-shrink-0 w-10 text-right">
                            {enr.progressPercent}%
                          </span>
                        </div>
                        {enr.status === 'completed' && (
                          <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600 font-semibold">
                            <Award className="w-3.5 h-3.5" /> Program completed
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Contact footer */}
        <div className="mt-14 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-900">Need help?</p>
            <p className="text-sm text-slate-500">Contact your student&apos;s program coordinator.</p>
          </div>
          <div className="flex gap-3">
            <a
              href="tel:3173143757"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
            >
              <Phone className="w-4 h-4" /> Call
            </a>
            <a
              href="mailto:info@elevateforhumanity.org"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
            >
              <Mail className="w-4 h-4" /> Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
