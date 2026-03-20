import Image from 'next/image';
import Link from 'next/link';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ── Data fetching (all queries scoped to this student) ─────────
// Uses admin client to bypass RLS — auth is verified before calling this.

async function getStudentData(userId: string, email: string) {
  const supabase = createAdminClient();
  if (!supabase) return { profile: null, programEnrollments: [], courseEnrollments: [], applications: [], appointments: [] };

  const [profileRes, progEnrollRes, courseEnrollRes, appRes, apptRes] = await Promise.all([
    // Profile — onboarding state
    supabase
      .from('profiles')
      .select('first_name, last_name, full_name, enrollment_status, onboarding_completed, funding_confirmed, orientation_completed, schedule_selected, avatar_url')
      .eq('id', userId)
      .single(),

    // Program enrollments (no join — FK points to training_programs, not programs)
    supabase
      .from('program_enrollments')
      .select('id, program_id, program_slug, status, enrollment_state, next_required_action, enrolled_at, started_at, completed_at, funding_source')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false }),

    // Course enrollments — individual courses with progress
    supabase
      .from('enrollments')
      .select('id, course_id, status, progress, enrolled_at, completed_at, courses(id, title, course_code, duration_hours)')
      .eq('user_id', userId)
      .order('enrolled_at', { ascending: false }),

    // Applications — deduplicated
    supabase
      .from('applications')
      .select('id, program_interest, program_id, status, created_at, next_step')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),

    // Upcoming appointments
    supabase
      .from('appointments')
      .select('id, appointment_type, appointment_date, appointment_time, status, location')
      .eq('email', email)
      .eq('status', 'scheduled')
      .order('appointment_date', { ascending: true })
      .limit(5),
  ]);

  // Enrich program enrollments with program details from apprenticeship_programs
  const enrollments = progEnrollRes.data || [];
  const programIds = [...new Set(enrollments.map((pe: any) => pe.program_id).filter(Boolean))];
  const programMap: Record<string, any> = {};
  if (programIds.length > 0) {
    const { data: programs } = await supabase
      .from('apprenticeship_programs')
      .select('id, name, slug, is_etpl_approved')
      .in('id', programIds);
    for (const p of (programs || [])) {
      programMap[p.id] = p;
    }
  }
  const enrichedEnrollments = enrollments.map((pe: any) => ({
    ...pe,
    program: programMap[pe.program_id] || null,
  }));

  return {
    profile: profileRes.data,
    programEnrollments: enrichedEnrollments,
    courseEnrollments: courseEnrollRes.data || [],
    applications: appRes.data || [],
    appointments: apptRes.data || [],
  };
}

// ── Helpers ─────────────────────────────────────────────────────

function statusColor(status: string) {
  const map: Record<string, string> = {
    active: 'bg-brand-blue-100 text-brand-blue-700',
    enrolled: 'bg-brand-blue-100 text-brand-blue-700',
    onboarding: 'bg-amber-100 text-amber-700',
    completed: 'bg-brand-green-100 text-brand-green-700',
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-brand-green-100 text-brand-green-700',
    converted: 'bg-brand-green-100 text-brand-green-700',
    scheduled: 'bg-brand-blue-100 text-brand-blue-700',
  };
  return map[status] || 'bg-white text-slate-600';
}

function formatSlug(slug: string | null) {
  if (!slug) return 'General';
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const APPT_LABELS: Record<string, string> = {
  enrollment: 'Enrollment Consultation',
  funding: 'Financial Aid Review',
  info: 'Program Info Session',
  career: 'Career Advising',
};

// ── Signed-out view ────────────────────────────────────────────

function SignedOutView() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="relative h-56 sm:h-64 overflow-hidden">
        <Image src="/images/pages/lms-page-2.jpg" alt="Students in classroom" fill className="object-cover" priority />
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <Image src="/logo.png" alt="Elevate" width={40} height={40} className="mb-3" />
          <h1 className="text-2xl font-bold text-slate-900">Student Portal</h1>
          <p className="text-brand-blue-200 text-sm mt-1">Sign in to view your program and progress</p>
        </div>
      </div>
      <div className="max-w-md mx-auto px-4 -mt-6 relative z-10 w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 text-center">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Welcome</h2>
          <p className="text-slate-500 text-sm mb-5">Sign in to access your courses, track progress, and manage your enrollment.</p>
          <Link href="/login" className="block w-full bg-brand-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-brand-blue-700 transition-colors">
            Sign In
          </Link>
          <p className="text-xs text-slate-500 mt-4">Need help? Call <a href="tel:+13173143757" className="text-brand-blue-600">(317) 314-3757</a></p>
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ─────────────────────────────────────────────

export default async function StudentPWAPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return <SignedOutView />;

  const { profile, programEnrollments, courseEnrollments, applications, appointments } = await getStudentData(user.id, user.email || '');

  const activeCourses = courseEnrollments.filter((e: any) => e.status === 'active' || e.status === 'enrolled');
  const completedCourses = courseEnrollments.filter((e: any) => e.status === 'completed');
  const firstName = profile?.first_name || user.user_metadata?.first_name || user.email?.split('@')[0] || 'Student';

  // Deduplicate applications by program_interest
  const seenApps = new Set<string>();
  const uniqueApps = applications.filter((a: any) => {
    const key = `${a.program_interest}-${a.status}`;
    if (seenApps.has(key)) return false;
    seenApps.add(key);
    return true;
  });

  // Determine primary CTA based on student state
  const hasProgram = programEnrollments.length > 0;
  const onboardingDone = profile?.onboarding_completed;
  const hasCourses = activeCourses.length > 0;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-44 sm:h-52 overflow-hidden">
        <Image src="/images/pages/adult-learner.jpg" alt="Students in classroom" fill className="object-cover" priority />
        <div className="absolute inset-0 flex flex-col justify-end p-6">
          <Image src="/logo.png" alt="Elevate" width={36} height={36} className="mb-2" />
          <h1 className="text-xl font-bold text-slate-900">Welcome back, {firstName}</h1>
          <p className="text-brand-blue-200 text-sm mt-0.5">{user.email}</p>
        </div>
      </div>

      {/* Stats — only real student-specific numbers */}
      <div className="grid grid-cols-3 gap-2 px-4 -mt-5 relative z-10">
        <div className="bg-white rounded-xl shadow-sm p-3 text-center">
          <div className="text-xl font-bold text-brand-blue-600">{activeCourses.length}</div>
          <div className="text-[10px] text-slate-500 leading-tight">In Progress</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 text-center">
          <div className="text-xl font-bold text-brand-green-600">{completedCourses.length}</div>
          <div className="text-[10px] text-slate-500 leading-tight">Completed</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-3 text-center">
          <div className="text-xl font-bold text-slate-900">{programEnrollments.length}</div>
          <div className="text-[10px] text-slate-500 leading-tight">{programEnrollments.length === 1 ? 'Program' : 'Programs'}</div>
        </div>
      </div>

      {/* Primary CTA — context-aware */}
      <div className="px-4 mt-5">
        {hasCourses ? (
          <Link href="/learner/dashboard" className="block w-full bg-brand-blue-600 text-white rounded-xl p-4 text-center font-semibold hover:bg-brand-blue-700 transition-colors">
            Resume Learning →
          </Link>
        ) : hasProgram && !onboardingDone ? (
          <Link href="/onboarding/learner" className="block w-full bg-amber-500 text-white rounded-xl p-4 text-center font-semibold hover:bg-amber-600 transition-colors">
            Complete Onboarding →
          </Link>
        ) : (
          <Link href="/start" className="block w-full bg-brand-red-600 text-white rounded-xl p-4 text-center font-semibold hover:bg-brand-red-700 transition-colors">
            Apply to a Program
          </Link>
        )}
      </div>

      {/* My Program — from program_enrollments + training_programs lookup */}
      {programEnrollments.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-base font-bold text-slate-900 mb-2">My Program</h2>
          {programEnrollments.map((pe: any) => {
            const program = pe.program;
            return (
              <div key={pe.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-2">
                <div className="p-4 pb-2">
                  <div className="font-bold text-slate-900">{program?.name || formatSlug(pe.program_slug)}</div>
                  {program?.category && <div className="text-xs text-slate-500 capitalize">{program.category}</div>}
                </div>
                <div className="p-4 pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(pe.enrollment_state || pe.status)}`}>
                      {pe.enrollment_state || pe.status}
                    </span>
                    {program?.is_etpl_approved && (
                      <span className="text-xs text-brand-green-600 font-medium">ETPL Approved</span>
                    )}
                  </div>
                  {pe.next_required_action && (
                    <span className="text-xs text-amber-600 font-medium">{pe.next_required_action}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Onboarding Checklist — only if not completed */}
      {hasProgram && !onboardingDone && (
        <div className="px-4 mt-6">
          <h2 className="text-base font-bold text-slate-900 mb-2">Onboarding Checklist</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            {[
              { done: true, label: 'Create account', href: null },
              { done: profile?.funding_confirmed, label: 'Confirm funding source', href: '/onboarding/learner' },
              { done: profile?.schedule_selected, label: 'Select your schedule', href: '/onboarding/learner' },
              { done: profile?.orientation_completed, label: 'Complete orientation', href: '/lms/orientation' },
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step.done ? 'bg-brand-green-100 text-brand-green-700' : 'bg-white text-slate-400'}`}>
                  {step.done ? '✓' : i + 1}
                </div>
                {step.href && !step.done ? (
                  <Link href={step.href} className="text-sm text-brand-blue-600 font-medium hover:underline">{step.label}</Link>
                ) : (
                  <span className={`text-sm ${step.done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{step.label}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      {appointments.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-base font-bold text-slate-900 mb-2">Upcoming Appointments</h2>
          <div className="space-y-2">
            {appointments.map((appt: any) => (
              <div key={appt.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-900 text-sm">{APPT_LABELS[appt.appointment_type] || appt.appointment_type}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(appt.status)}`}>{appt.status}</span>
                </div>
                <div className="text-sm text-slate-600">
                  {new Date(appt.appointment_date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {appt.appointment_time}
                </div>
                {appt.location && appt.location.startsWith('https://') && (
                  <a href={appt.location} target="_blank" rel="noopener noreferrer" className="text-brand-blue-600 text-xs font-medium mt-1 inline-block hover:underline">
                    Join Zoom →
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Courses — from enrollments, scoped to this student */}
      <div className="px-4 mt-6">
        <h2 className="text-base font-bold text-slate-900 mb-2">
          {activeCourses.length > 0 ? `My Courses (${activeCourses.length})` : 'My Courses'}
        </h2>
        {activeCourses.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center">
            <p className="text-slate-500 text-sm mb-1">No courses assigned yet.</p>
            <p className="text-slate-500 text-xs">
              {hasProgram
                ? 'Your courses will appear here once onboarding is complete.'
                : 'Apply to a program to get started.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {activeCourses.map((enrollment: any) => {
              const course = enrollment.courses;
              const progress = enrollment.progress || 0;
              return (
                <Link key={enrollment.id} href={`/lms/courses/${enrollment.course_id}`} className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-brand-blue-300 transition-colors">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center text-brand-blue-600 font-bold text-xs flex-shrink-0">
                      {course?.course_code?.slice(0, 3) || 'CRS'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-900 text-sm truncate">{course?.title || 'Course'}</div>
                      <div className="text-xs text-slate-500">
                        {course?.duration_hours ? `${course.duration_hours} hrs` : 'Self-paced'} · Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <span className="text-slate-500 text-sm flex-shrink-0">→</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <div className="bg-white h-2 rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                  <div className="text-xs text-slate-500 mt-1">{progress}% complete</div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Courses */}
      {completedCourses.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-base font-bold text-slate-900 mb-2">Completed ({completedCourses.length})</h2>
          <div className="space-y-2">
            {completedCourses.map((enrollment: any) => {
              const course = enrollment.courses;
              return (
                <div key={enrollment.id} className="bg-white rounded-xl border border-brand-green-200 p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-green-100 rounded-lg flex items-center justify-center text-brand-green-700 font-bold text-sm flex-shrink-0">✓</div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 text-sm truncate">{course?.title || 'Course'}</div>
                    <div className="text-xs text-slate-500">
                      Completed {enrollment.completed_at ? new Date(enrollment.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Applications */}
      {uniqueApps.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-base font-bold text-slate-900 mb-2">My Applications</h2>
          <div className="space-y-2">
            {uniqueApps.map((app: any) => (
              <div key={app.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900 text-sm">{formatSlug(app.program_interest)}</div>
                  <div className="text-xs text-slate-500">
                    Applied {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {app.next_step && <div className="text-xs text-amber-600 mt-0.5">Next: {app.next_step}</div>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(app.status)}`}>{app.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 mt-8 pb-8 text-center">
        <p className="text-xs text-slate-500">Need help? Call <a href="tel:+13173143757" className="text-brand-blue-600">(317) 314-3757</a></p>
      </div>
    </div>
  );
}
