import Image from 'next/image';
import { getPrestigeCourseCover } from '@/lib/lms/prestige-course-covers';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  Gauge,
  PlayCircle,
  ShieldCheck,
  LockKeyhole,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getRegisteredProgramStandard } from '@/lib/apprenticeship/registered-program-contract';
import { TheoryWindowNotice } from '@/components/apprenticeship/TheoryWindowNotice';
import { resolveCoursePreview } from '@/lib/admin/course-preview';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Course | Elevate LMS',
  robots: { index: false, follow: false },
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
function humanizeDomain(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

type ReadinessRow = {
  domain_key: string;
  latest_score: number | null;
  passing_score: number | null;
  passed: boolean;
  attempt_count: number;
  last_attempt_at: string | null;
};

export default async function CourseLandingPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const preview = await resolveCoursePreview(courseId);
  if (!user && !preview.active)
    redirect(`/login?redirect=${encodeURIComponent(`/lms/courses/${courseId}`)}`);
  const db = preview.active ? preview.db : supabase;

  let courseQuery = db
    .from('courses')
    .select('id,title,slug,description,status,is_active,duration_hours,governing_standard_version');
  if (!preview.active) courseQuery = courseQuery.eq('is_active', true);
  courseQuery = isUuid(courseId)
    ? courseQuery.eq('id', courseId)
    : courseQuery.eq('slug', courseId);
  const { data: course } = await courseQuery.maybeSingle();
  if (!course) notFound();

  const [{ data: modules }, { data: lessons }, { data: heroVisual }, { data: readinessData }] =
    await Promise.all([
      db
        .from('course_modules')
        .select('id,title,description,order_index,is_published')
        .eq('course_id', course.id)
        .match(preview.active ? {} : { is_published: true })
        .order('order_index'),
      db
        .from('course_lessons')
        .select(
          'id,module_id,slug,title,lesson_type,order_index,duration_minutes,is_published,learning_objectives',
        )
        .eq('course_id', course.id)
        .match(preview.active ? {} : { is_published: true })
        .order('order_index'),
      db
        .from('course_visual_assets')
        .select('asset_url,poster_url,alt_text,caption,media_type,metadata')
        .eq('course_id', course.id)
        .eq('placement', 'hero')
        .eq('is_active', true)
        .order('sort_order')
        .limit(1)
        .maybeSingle(),
      preview.active
        ? Promise.resolve({ data: [] })
        : supabase.rpc('get_my_course_readiness', { p_course_id: course.id }),
    ]);

  const { data: pacingData, error: pacingError } = preview.active
    ? { data: null, error: null }
    : await supabase.rpc('get_my_course_pacing', { p_course_id: course.id });
  if (pacingError) throw new Error('Unable to verify the course release schedule');
  const pacing = pacingData as {
    totalWeeks: number;
    startAt: string | null;
    progressive: boolean;
    lessons: Array<{
      id: string;
      module_id: string;
      title: string;
      order_index: number;
      lesson_type: string;
      duration_minutes: number;
      published: boolean;
      releaseWeek: number;
      opensAt: string | null;
      available: boolean;
    }>;
  } | null;
  const readiness = (readinessData ?? []) as ReadinessRow[];
  const publishedModules = modules ?? [];
  const publishedLessons = lessons ?? [];
  const objectivesByLesson = new Map(
    publishedLessons.map((lesson) => [lesson.id, lesson.learning_objectives]),
  );
  const syllabusLessons = pacing
    ? pacing.lessons.map((lesson) => ({
        ...lesson,
        learning_objectives: objectivesByLesson.get(lesson.id),
      }))
    : publishedLessons.map((lesson) => ({
        ...lesson,
        published: lesson.is_published,
        releaseWeek: null,
        opensAt: null,
        available: true,
      }));
  const firstLesson = publishedLessons[0] ?? null;
  const heroMetadata =
    heroVisual?.metadata &&
    typeof heroVisual.metadata === 'object' &&
    !Array.isArray(heroVisual.metadata)
      ? (heroVisual.metadata as Record<string, unknown>)
      : {};
  const heroCtaLabel =
    typeof heroMetadata.cta_label === 'string' && heroMetadata.cta_label.trim()
      ? heroMetadata.cta_label
      : null;
  const totalMinutes = publishedLessons.reduce(
    (sum, lesson) => sum + Number(lesson.duration_minutes ?? 0),
    0,
  );
  const courseCover = getPrestigeCourseCover(course.id);
  const registeredContract = course.slug ? getRegisteredProgramStandard(course.slug) : null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      {preview.active ? (
        <div className="sticky top-0 z-50 bg-amber-300 px-4 py-2 text-center text-sm font-black text-slate-950">
          Admin draft preview · Learner progress is not recorded
        </div>
      ) : null}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          {courseCover ? (
            <figure className="mb-5 max-w-24 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-xl">
              <Image src={courseCover} alt={`${course.title} course cover`} width={1024} height={1536} sizes="96px" className="h-auto w-full" priority />
            </figure>
          ) : null}
          {heroVisual?.media_type === 'video' ? (
            <figure className="relative mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-xl">
              <video
                className="aspect-[8/3] w-full object-cover motion-reduce:hidden"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                controls
                controlsList="nodownload"
                poster={heroVisual.poster_url || undefined}
                aria-label={heroVisual.alt_text}
              >
                <source src={heroVisual.asset_url} type="video/mp4" />
              </video>
              <img
                className="hidden aspect-[8/3] w-full object-cover motion-reduce:block"
                src={heroVisual.poster_url || '/images/barber-hero-new.webp'}
                alt={heroVisual.alt_text || course.title}
              />
              {firstLesson && heroCtaLabel ? (
                <Link
                  href={`/lms/courses/${course.id}/lessons/${firstLesson.id}`}
                  className="absolute bottom-5 left-5 rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-950 shadow-lg transition hover:bg-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-200"
                >
                  {heroCtaLabel}
                </Link>
              ) : null}
              {heroVisual.caption ? (
                <figcaption className="sr-only">{heroVisual.caption}</figcaption>
              ) : null}
            </figure>
          ) : heroVisual?.media_type === 'image' ? (
            <figure className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-xl">
              <img
                className="aspect-[8/3] w-full object-cover"
                src={heroVisual.asset_url}
                alt={heroVisual.alt_text || course.title}
              />
              {heroVisual.caption ? (
                <figcaption className="sr-only">{heroVisual.caption}</figcaption>
              ) : null}
            </figure>
          ) : null}
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-800">Elevate LMS</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
            {course.title}
          </h1>
          <p className="mt-4 max-w-4xl text-base font-medium leading-7 text-slate-700">
            {course.description || 'Course lessons, checkpoints, and required assessments.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold text-slate-800">
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
              <BookOpen className="h-4 w-4" />{' '}
              {pacing
                ? pacing.lessons.filter((lesson) => lesson.published).length
                : publishedLessons.length}{' '}
              published lessons
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
              <Clock3 className="h-4 w-4" /> {Math.round((totalMinutes / 60) * 10) / 10} scheduled
              digital lesson hours
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-emerald-900">
              <CheckCircle2 className="h-4 w-4" />{' '}
              {course.status === 'published' ? 'Published' : 'Progressive release'}
            </span>
          </div>
          {(pacing as any)?.theoryWindow ? (
            <TheoryWindowNotice access={(pacing as any).theoryWindow} />
          ) : null}
          {pacing ? (
            <section
              className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"
              aria-label="Weekly course release"
            >
              <h2 className="font-extrabold">{pacing.totalWeeks}-week learning plan</h2>
              <p className="mt-2 font-semibold">
                Lessons open by training week. Complete each earlier required lesson, its assessment
                and required shop work before continuing. Future lessons remain locked even when
                their videos are finished.
              </p>
              {pacing.startAt ? (
                <p className="mt-2 text-sm">
                  Your recorded training start:{' '}
                  {new Date(pacing.startAt).toLocaleDateString('en-US', {
                    timeZone: 'America/Indiana/Indianapolis',
                  })}
                  .
                </p>
              ) : (
                <p className="mt-2 text-sm">
                  Each learner’s recorded training start determines their release dates.
                </p>
              )}
              <p className="mt-2 text-sm">
                Weeks between lesson releases are for supervised practice, review and required
                evidence. Calendar weeks do not create RTI or work-hour credit.
              </p>
            </section>
          ) : null}
          {registeredContract ? (
            <section className="mt-6 rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-cyan-950">
              <div className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <h2 className="font-extrabold">Registered-program governed RTI</h2>
                  <p className="mt-2 text-sm font-semibold leading-6">
                    This course maps to RAPIDS occupation {registeredContract.standard.rapidsCode}.
                    The registered contract requires{' '}
                    {registeredContract.completion.requiredRtiHours} verified RTI hours and{' '}
                    {registeredContract.completion.competencyCount} competencies with a{' '}
                    {registeredContract.standard.apprenticeToMentorRatio} apprentice-to-mentor ratio
                    and {registeredContract.standard.probationaryHours}-hour probationary period.
                    Digital lesson duration is learning evidence, not a fabricated fixed OJL
                    completion requirement.
                  </p>
                  <p className="mt-2 text-xs font-bold uppercase tracking-wide text-cyan-800">
                    Standard revision {registeredContract.sponsor.revisionDate} · Registration{' '}
                    {registeredContract.sponsor.registrationNumber}
                  </p>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </section>

      {readiness.length > 0 ? (
        <section
          className="mx-auto max-w-6xl px-4 pt-8 sm:px-6"
          aria-labelledby="course-readiness-heading"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5 text-cyan-700" aria-hidden />
              <h2 id="course-readiness-heading" className="text-xl font-extrabold">
                Readiness by Domain
              </h2>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-600">
              Your latest checkpoint evidence. Use weak domains to guide targeted review before the
              practice and final assessments.
            </p>
            <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {readiness.map((row) => {
                const score = row.latest_score;
                const target = row.passing_score ?? 80;
                return (
                  <article
                    key={row.domain_key}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-extrabold text-slate-950">
                      {humanizeDomain(row.domain_key)}
                    </p>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <span className="text-3xl font-black text-slate-950">
                        {score == null ? '—' : `${score}%`}
                      </span>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-bold ${row.passed ? 'bg-emerald-100 text-emerald-900' : score == null ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-900'}`}
                      >
                        {row.passed ? 'Ready' : score == null ? 'Not assessed' : 'Review'}
                      </span>
                    </div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full ${row.passed ? 'bg-emerald-500' : 'bg-amber-500'}`}
                        style={{ width: `${Math.max(0, Math.min(score ?? 0, 100))}%` }}
                      />
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-600">
                      Target {target}% · {Number(row.attempt_count)} attempt
                      {Number(row.attempt_count) === 1 ? '' : 's'}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6">
        {publishedModules.map((module) => {
          const moduleLessons = syllabusLessons.filter((lesson) => lesson.module_id === module.id);
          return (
            <article
              key={module.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
                <h2 className="text-xl font-extrabold text-slate-950">{module.title}</h2>
                {module.description ? (
                  <p className="mt-1 text-sm font-medium text-slate-700">{module.description}</p>
                ) : null}
              </div>
              <div className="divide-y divide-slate-100">
                {moduleLessons.map((lesson, index) => {
                  const accessible = preview.active || (lesson.published && lesson.available);
                  const contents = (
                    <>
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-600">
                          {lesson.releaseWeek ? `Week ${lesson.releaseWeek} · ` : ''}
                          {lesson.lesson_type === 'exam'
                            ? 'Final exam'
                            : lesson.lesson_type === 'checkpoint'
                              ? 'Module checkpoint'
                              : `Lesson ${lesson.order_index ?? index + 1}`}
                        </p>
                        <p className="mt-1 font-bold text-slate-950">{lesson.title}</p>
                        {Array.isArray(lesson.learning_objectives) ? (
                          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
                            {lesson.learning_objectives
                              .filter(
                                (objective): objective is string =>
                                  typeof objective === 'string' && objective.trim().length > 0,
                              )
                              .map((objective, index) => (
                                <li key={index}>{objective}</li>
                              ))}
                          </ul>
                        ) : null}
                        <p className="mt-1 text-sm font-medium text-slate-600">
                          {!lesson.published
                            ? 'In production · Available after completion and verification'
                            : !lesson.available && !preview.active
                              ? `Locked · Complete prior lessons and reach week ${lesson.releaseWeek}${lesson.opensAt ? ` · Opens ${new Date(lesson.opensAt).toLocaleDateString('en-US', { timeZone: 'America/Indiana/Indianapolis' })}` : ''}`
                              : `${Number(lesson.duration_minutes ?? 0)} min scheduled digital instruction`}
                        </p>
                      </div>
                      {accessible ? (
                        <PlayCircle className="h-6 w-6 shrink-0 text-cyan-700" aria-hidden />
                      ) : (
                        <LockKeyhole className="h-6 w-6 shrink-0 text-slate-500" aria-hidden />
                      )}
                    </>
                  );
                  return accessible ? (
                    <Link
                      key={lesson.id}
                      href={`/lms/courses/${course.id}/lessons/${lesson.id}`}
                      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-slate-50"
                    >
                      {contents}
                    </Link>
                  ) : (
                    <div
                      key={lesson.id}
                      aria-disabled="true"
                      className="flex items-center justify-between gap-4 bg-slate-50 px-5 py-4"
                    >
                      {contents}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
        {publishedModules.length === 0 ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 font-semibold text-amber-950">
            This course is published, but no published modules are currently available. Contact
            support before continuing.
          </div>
        ) : null}
      </section>
    </main>
  );
}
