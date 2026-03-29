
import { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import {
  Play, Clock, BookOpen, Award, Lock, ChevronRight,
  CheckCircle, Shield, FileText, Zap, FlaskConical,
  Brain, ClipboardList, Video, Wrench, Thermometer, BadgeCheck,
  TrendingUp, MapPin, DollarSign,
} from 'lucide-react';
import { CourseModuleAccordion } from '@/components/lms/CourseModuleAccordion';

export const dynamic = 'force-dynamic';

type Params = Promise<{ courseId: string }>;

async function resolveCourse(courseId: string) {
  const db = createAdminClient();
  const { data: course } = await db
    .from('courses')
    .select('id, title, description, short_description, status, is_active, program_id, slug')
    .eq('id', courseId)
    .maybeSingle();
  if (course) return { ...course, _lessonCourseId: course.id };

  const { data: tc } = await db
    .from('training_courses')
    .select('id, title, description, is_active, slug')
    .eq('id', courseId)
    .maybeSingle();
  if (!tc) return null;

  let lessonCourseId = tc.id;
  const { data: canonicalCourse } = await db
    .from('courses').select('id').eq('slug', tc.slug).maybeSingle();
  if (canonicalCourse?.id) lessonCourseId = canonicalCourse.id;

  return {
    id: tc.id, title: tc.title, description: tc.description,
    short_description: null, status: 'published', is_active: tc.is_active,
    program_id: null, slug: tc.slug, _lessonCourseId: lessonCourseId,
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { courseId } = await params;
  const course = await resolveCourse(courseId);
  return {
    title: course ? `${course.title} | Elevate LMS` : 'Course | Elevate LMS',
    description: course?.description || 'View course details and lessons.',
  };
}

export default async function CoursePage({ params }: { params: Params }) {
  const { courseId } = await params;
  const supabase = await createClient();
  const db = createAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/lms/courses/' + courseId);

  if (!db) {
    // Admin client unavailable — service role key not configured.
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        Course data unavailable. Please contact support.
      </div>
    );
  }

  const course = await resolveCourse(courseId);
  if (!course) notFound();

  // lessonCourseId is the canonical courses UUID — may differ from the URL
  // param when the URL uses a training_courses ID (e.g. legacy HVAC routes).
  // All downstream queries — including enrollment — must use this value.
  const lessonCourseId = (course as any)._lessonCourseId || courseId;

  const { data: program } = course.program_id
    ? await supabase.from('programs')
        .select('image_url, hero_image_url, credential_name, credential_type, credential')
        .eq('id', course.program_id).single()
    : { data: null };

  const heroImage = program?.hero_image_url || program?.image_url || '/images/pages/hvac-unit.jpg';
  const credentialName = program?.credential_name || program?.credential || null;

  // Check if user is admin/staff — they bypass enrollment requirements entirely.
  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdminUser = ['admin', 'super_admin', 'staff'].includes(profile?.role ?? '');

  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('status, enrollment_state, enrolled_at')
    .eq('user_id', user.id).eq('course_id', lessonCourseId).maybeSingle();

  if (!isAdminUser && enrollment?.status === 'revoked') redirect('/lms/programs');
  if (!isAdminUser && enrollment?.enrollment_state === 'pending_funding_verification')
    redirect(`/lms/enrollment-pending?courseId=${lessonCourseId}`);

  // Admins are always treated as enrolled — they should never see "Enroll Now".
  const isPendingApproval = !isAdminUser && enrollment?.status === 'pending_approval';

  const { data: modulesRaw } = await db
    .from('course_modules').select('id, title, order_index')
    .eq('course_id', lessonCourseId).order('order_index', { ascending: true });

  const { data: lessonsRaw } = await db
    .from('lms_lessons')
    .select('id, title, duration_minutes, order_index, content_type, step_type, module_id, activities, lesson_slug, passing_score')
    .eq('course_id', lessonCourseId).order('order_index', { ascending: true });

  const allLessons = (lessonsRaw || []) as any[];

  const { data: lessonProgress } = await supabase
    .from('lesson_progress').select('lesson_id, completed, completed_at')
    .eq('user_id', user.id)
    .in('lesson_id', allLessons.map((l) => l.id));

  const progressMap = new Map((lessonProgress || []).map((p: any) => [p.lesson_id, p]));

  const modules = (modulesRaw || []).map((mod: any) => ({
    ...mod,
    lessons: allLessons
      .filter((l) => l.module_id === mod.id)
      .sort((a: any, b: any) => a.order_index - b.order_index),
  }));

  const ungrouped = allLessons.filter((l) => !l.module_id);
  const completedCount = allLessons.filter((l) => progressMap.get(l.id)?.completed).length;
  const progressPct = allLessons.length > 0 ? Math.round((completedCount / allLessons.length) * 100) : 0;
  const nextLesson = allLessons.find((l) => !progressMap.get(l.id)?.completed);
  const totalMinutes = allLessons.reduce((sum: number, l: any) => sum + (l.duration_minutes || 0), 0);
  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  const checkpointCount = allLessons.filter((l) =>
    l.step_type === 'checkpoint' || l.content_type === 'quiz').length;
  const isEnrolled = isAdminUser || (!!enrollment && !isPendingApproval);

  // Derive activity types actually present across all lessons from DB records.
  // activities is stored as JSONB — either {video:true, reading:true, ...}
  // or [{type:'video'}, ...]. Handle both shapes.
  const activityTypeSet = new Set<string>();
  for (const l of allLessons) {
    if (!l.activities) continue;
    if (Array.isArray(l.activities)) {
      // Array shape: [{type:'video'}, ...]
      for (const a of l.activities) {
        if (a?.type) activityTypeSet.add(a.type);
      }
    } else if (typeof l.activities === 'object') {
      // Object shape: {video: true, reading: true, ...}
      for (const [key, val] of Object.entries(l.activities)) {
        if (val) activityTypeSet.add(key);
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* HERO */}
      <div className="relative h-[340px] sm:h-[440px] w-full overflow-hidden bg-slate-900">
        <Image src={heroImage} alt={course.title} fill className="object-cover object-center opacity-50" priority />
        {/* gradient: dark at bottom for text legibility, slight tint at top */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/20" />
        <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-12 max-w-5xl mx-auto w-full">
          <nav className="flex items-center gap-1.5 text-xs text-white/50 mb-4">
            <Link href="/lms/courses" className="hover:text-white transition">My Courses</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/70">Program Overview</span>
          </nav>
          {/* Program type badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-brand-orange-500/90 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
              <Wrench className="w-3 h-3" /> Skilled Trades
            </span>
            {credentialName && (
              <span className="inline-flex items-center gap-1.5 bg-amber-500/90 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                <BadgeCheck className="w-3 h-3" /> Federal Certification
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight drop-shadow-lg mb-3">
            {course.title}
          </h1>
          <p className="text-base sm:text-lg text-white/80 font-medium max-w-2xl leading-relaxed mb-5">
            Complete this program and you'll be EPA 608 certified — the federal credential required to purchase and handle regulated refrigerants, and a baseline requirement for employment at any HVAC company.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {isEnrolled && nextLesson ? (
              <Link href={`/lms/courses/${courseId}/lessons/${nextLesson.id}`}
                className="inline-flex items-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-500 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg text-sm">
                <Play className="w-4 h-4" />{completedCount > 0 ? 'Continue Training' : 'Start Training'}
              </Link>
            ) : !isEnrolled && !isPendingApproval ? (
              <Link href={`/lms/courses/${courseId}/enroll`}
                className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-500 text-white font-bold px-6 py-3 rounded-xl transition shadow-lg text-sm">
                Apply Now — Free
              </Link>
            ) : null}
            <div className="flex items-center gap-4 text-white/70 text-sm">
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{totalHours > 0 ? `${totalHours}+ hrs` : `${remainingMinutes}m`}</span>
              <span className="flex items-center gap-1.5"><BookOpen className="w-4 h-4" />{allLessons.length} lessons</span>
              <span className="flex items-center gap-1.5"><Shield className="w-4 h-4" />{checkpointCount} checkpoints</span>
            </div>
          </div>
        </div>
      </div>

      {/* OUTCOME STRIP — what you'll be able to do after this program */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Thermometer, color: 'text-brand-orange-400', title: 'Install & Service Systems', body: 'Residential and commercial HVAC — heating, cooling, ventilation, and refrigeration systems.' },
              { icon: BadgeCheck,  color: 'text-amber-400',        title: 'EPA 608 Certified',         body: 'Required by federal law to handle refrigerants. A baseline requirement at every HVAC employer.' },
              { icon: DollarSign,  color: 'text-green-400',        title: '$45K–$75K in Indiana',      body: 'BLS median for HVAC technicians in Indiana. Experienced techs and union roles go higher.' },
            ].map(({ icon: Icon, color, title, body }) => (
              <div key={title} className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">{title}</p>
                  <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PROGRESS BAR — enrolled users only, sits between hero and main content */}
      {isEnrolled && (
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-4">
            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-blue-600 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <span className="text-xs font-bold text-slate-700 whitespace-nowrap">{progressPct}% complete</span>
            <span className="text-xs text-slate-500 whitespace-nowrap hidden sm:block">{completedCount} of {allLessons.length} lessons</span>
            {!nextLesson && (
              <span className="flex items-center gap-1 text-green-700 font-bold text-xs bg-green-50 border border-green-200 px-2.5 py-1 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5" /> Complete
              </span>
            )}
            {enrollment && isPendingApproval && (
              <span className="flex items-center gap-1 text-amber-700 font-bold text-xs bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                <Clock className="w-3.5 h-3.5" /> Pending Approval
              </span>
            )}
          </div>
        </div>
      )}

      {/* MAIN */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* MAIN CONTENT COLUMN */}
          <div className="lg:col-span-2">

            {/* CREDENTIAL TRUST BLOCK — high visual weight, above the fold */}
            <div className="bg-slate-900 rounded-xl p-5 mb-6">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Credentials You'll Earn</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: BadgeCheck, color: 'bg-amber-500',        label: 'EPA 608 Universal',    sub: 'Federal credential — required to purchase and handle regulated refrigerants' },
                  { icon: Shield,     color: 'bg-orange-600',        label: 'OSHA 10',              sub: 'DOL-issued Construction Safety card' },
                  { icon: Award,      color: 'bg-brand-blue-600',    label: 'CPR / First Aid',      sub: 'Industry-standard certification included' },
                ].map(({ icon: Icon, color, label, sub }) => (
                  <div key={label} className="flex items-start gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                    <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">{label}</p>
                      <p className="text-slate-400 text-xs mt-0.5 leading-snug">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ABOUT */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
              <h2 className="text-base font-extrabold text-slate-900 mb-2">About This Program</h2>
              <p className="text-slate-700 text-sm leading-relaxed">
                This is a workforce training program — not a survey course. You'll learn to diagnose, install, and service real HVAC systems, then sit for the EPA 608 Universal exam. WIOA funding is available for eligible students; no out-of-pocket cost for those who qualify.
              </p>
              {(course.description || course.short_description) && (
                <p className="text-slate-500 text-sm leading-relaxed mt-2">
                  {course.short_description || course.description}
                </p>
              )}
            </div>
            <div className="mb-4">
              <h2 className="text-lg font-extrabold text-slate-900">Course Curriculum</h2>
              <p className="text-sm text-slate-500 mt-1">
                {modules.length} modules · {allLessons.length} lessons · {totalHours > 0 ? `${totalHours}+ hours` : `${remainingMinutes}m`} of training
              </p>
            </div>

            {/* Phase overview — groups modules into industry training phases */}
            {modules.length >= 10 && (() => {
              const phases = [
                { label: 'Phase 1', name: 'Foundations',         range: [1, 3],  color: 'bg-blue-50 border-blue-200 text-blue-800' },
                { label: 'Phase 2', name: 'Refrigeration',       range: [4, 5],  color: 'bg-cyan-50 border-cyan-200 text-cyan-800' },
                { label: 'Phase 3', name: 'EPA Regulations',     range: [6, 6],  color: 'bg-orange-50 border-orange-200 text-orange-800' },
                { label: 'Phase 4', name: 'Certification Tracks',range: [7, 9],  color: 'bg-purple-50 border-purple-200 text-purple-800' },
                { label: 'Phase 5', name: 'Exam Prep',           range: [10, 11],color: 'bg-green-50 border-green-200 text-green-800' },
              ];
              return (
                <div className="mb-6 grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {phases.map(({ label, name, range, color }) => {
                    const count = modules.filter((_: any, i: number) => i + 1 >= range[0] && i + 1 <= range[1]).length;
                    if (count === 0) return null;
                    return (
                      <div key={label} className={`rounded-lg border px-3 py-2.5 ${color}`}>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">{label}</p>
                        <p className="text-xs font-semibold mt-0.5 leading-tight">{name}</p>
                        <p className="text-[10px] mt-1 opacity-60">{count} module{count !== 1 ? 's' : ''}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {modules.length > 0 ? (
              <CourseModuleAccordion
                modules={modules}
                courseId={courseId}
                progressMap={Object.fromEntries(progressMap)}
                isEnrolled={isEnrolled}
                isPendingApproval={!!isPendingApproval}
              />
            ) : ungrouped.length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                {ungrouped.map((lesson: any, index: number) => {
                  const isCompleted = progressMap.get(lesson.id)?.completed;
                  const prevDone = index === 0 || progressMap.get(ungrouped[index - 1]?.id)?.completed;
                  const isLocked = isPendingApproval || (!enrollment && index > 0) || (enrollment && !isCompleted && !prevDone);
                  const isCheckpoint = lesson.step_type === 'checkpoint' || lesson.content_type === 'quiz';
                  return (
                    <div key={lesson.id} className="border-b border-slate-100 last:border-b-0">
                      {isLocked ? (
                        <div className="flex items-center gap-3 px-4 py-3.5 opacity-40 cursor-not-allowed">
                          <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-slate-700">{lesson.title}</span>
                        </div>
                      ) : (
                        <Link href={`/lms/courses/${courseId}/lessons/${lesson.id}`}
                          className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 transition group">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted ? 'bg-green-500' : 'bg-slate-100 group-hover:bg-slate-200'}`}>
                            {isCompleted ? <CheckCircle className="w-4 h-4 text-white" /> : <Play className="w-3 h-3 text-slate-500" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isCompleted ? 'text-green-800' : 'text-slate-900'}`}>{lesson.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {isCheckpoint && <span className="text-[10px] font-bold text-brand-orange-600 bg-brand-orange-50 border border-brand-orange-200 px-1.5 py-0.5 rounded">CHECKPOINT</span>}
                              {lesson.duration_minutes && <span className="text-xs text-slate-400">{lesson.duration_minutes} min</span>}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 flex-shrink-0" />
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
                <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No lessons available yet.</p>
              </div>
            )}
          </div>

          {/* SIDEBAR */}
          <div className="space-y-4">

            {/* PRIMARY ACTION CARD */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              {isEnrolled ? (
                <div className="p-5">
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="text-slate-600 font-medium">Your Progress</span>
                      <span className="font-extrabold text-slate-900">{progressPct}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-blue-600 rounded-full transition-all" style={{ width: `${progressPct}%` }} />
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">{completedCount} of {allLessons.length} lessons complete</p>
                  </div>
                  {nextLesson ? (
                    <Link href={`/lms/courses/${courseId}/lessons/${nextLesson.id}`}
                      className="w-full flex items-center justify-center gap-2 bg-brand-blue-600 hover:bg-brand-blue-700 text-white py-3.5 rounded-xl font-bold transition text-sm">
                      <Play className="w-4 h-4" />{completedCount > 0 ? 'Continue Training' : 'Start Training'}
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-3.5 bg-green-50 text-green-800 rounded-xl font-bold text-sm border border-green-200">
                      <CheckCircle className="w-4 h-4" /> Training Complete
                    </div>
                  )}
                </div>
              ) : enrollment && isPendingApproval ? (
                <div className="p-5 text-center">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-900 text-sm mb-1">Enrollment Under Review</p>
                  <p className="text-xs text-slate-500">We'll email you when confirmed.</p>
                </div>
              ) : (
                <div className="p-5">
                  <p className="text-xs text-slate-500 mb-3 text-center">Funding available through WIOA &amp; DOL</p>
                  <Link href={`/lms/courses/${courseId}/enroll`}
                    className="w-full flex items-center justify-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white py-3.5 rounded-xl font-bold transition text-sm">
                    Apply Now — Free
                  </Link>
                </div>
              )}
            </div>

            {/* PROGRAM DETAILS */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Program Details</h3>
              <dl className="space-y-3">
                {[
                  { label: 'Training Hours', value: totalHours > 0 ? `${totalHours}h ${remainingMinutes}m` : `${remainingMinutes}m` },
                  { label: 'Modules',        value: modules.length || '—' },
                  { label: 'Lessons',        value: allLessons.length },
                  { label: 'Checkpoints',    value: checkpointCount },
                  { label: 'Certificate',    value: 'Included' },
                  { label: 'Level',          value: 'Entry–Intermediate' },
                  { label: 'Funding',        value: 'WIOA / DOL eligible' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-center justify-between">
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="text-xs font-semibold text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* CAREER OUTCOME */}
            <div className="bg-slate-900 rounded-xl p-5">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">After Completion</p>
              <div className="space-y-3">
                {[
                  { icon: TrendingUp, color: 'text-green-400',  text: 'Qualified for entry-level HVAC roles upon certification' },
                  { icon: MapPin,     color: 'text-blue-400',   text: 'Strong demand across Indiana — residential, commercial, and industrial' },
                  { icon: DollarSign, color: 'text-amber-400',  text: '$45K–$75K median range in Indiana (BLS)' },
                ].map(({ icon: Icon, color, text }) => (
                  <div key={text} className="flex items-start gap-2.5">
                    <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${color}`} />
                    <p className="text-slate-300 text-xs leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            {activityTypeSet.size > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Each Lesson Includes</h3>
                <ul className="space-y-2.5">
                  {([
                    { type: 'video',       icon: Video,        label: 'Instructor Video',   color: 'text-brand-blue-600' },
                    { type: 'reading',     icon: FileText,     label: 'Reading & Notes',    color: 'text-slate-500' },
                    { type: 'flashcards',  icon: Brain,        label: 'Flashcards',         color: 'text-purple-600' },
                    { type: 'lab',         icon: FlaskConical, label: 'Hands-On Lab',       color: 'text-green-600' },
                    { type: 'practice',    icon: Zap,          label: 'Practice Questions', color: 'text-amber-600' },
                    { type: 'checkpoint',  icon: Shield,       label: 'Checkpoint Quiz',    color: 'text-brand-red-600' },
                  ] as const).filter(({ type }) => activityTypeSet.has(type)).map(({ icon: Icon, label, color }) => (
                    <li key={label} className="flex items-center gap-2.5 text-sm text-slate-700">
                      <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {credentialName && (
              <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Credential</h3>
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{credentialName}</p>
                    {program?.credential_type && <p className="text-xs text-slate-500 mt-0.5">{program.credential_type}</p>}
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
