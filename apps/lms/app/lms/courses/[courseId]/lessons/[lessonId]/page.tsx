import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, BookOpen, CheckCircle2, Clock3, Video } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import InteractiveLessonExperience from '@/components/lms/InteractiveLessonExperience';
import AITeachingPlayer, { type TeachingSlide } from '@/components/lms/AITeachingPlayer';
import { getInstructorForCourse } from '@/lib/ai-instructors';
import LessonProgressClient from './LessonProgressClient';
import LessonFocusShell from '@/components/lms/LessonFocusShell';
import InteractiveVideoPlayer, { type Checkpoint } from '@/components/lms/InteractiveVideoPlayer';
import { resolveCoursePreview } from '@/lib/admin/course-preview';
import { assertLessonAccess } from '@/lib/lms/access-control';
import { managedLessonPlaybackUrl } from '@/lib/storage/lesson-playback';
import { measuredLessonCues } from '@/lib/video/measured-lesson-assets';
import { TheoryWindowNotice } from '@/components/apprenticeship/TheoryWindowNotice';
import { TheoryWindowBoundary } from '@/components/apprenticeship/TheoryWindowBoundary';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Lesson | Elevate LMS',
  robots: { index: false, follow: false },
};

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function htmlFromContent(content: unknown, renderedHtml?: string | null) {
  if (renderedHtml?.trim()) return renderedHtml;
  if (typeof content === 'string') return content;
  if (content && typeof content === 'object') {
    const record = content as Record<string, unknown>;
    for (const key of ['html', 'content', 'body', 'text']) {
      if (typeof record[key] === 'string') return record[key] as string;
    }
  }
  return '';
}

function plainText(value: string) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function teachingSlides(title: string, html: string): TeachingSlide[] {
  const parts = html.split(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi);
  const slides: TeachingSlide[] = [];
  const introduction = plainText(parts[0] ?? '');
  if (introduction) slides.push({ title, narration: introduction.slice(0, 900) });
  for (let index = 1; index < parts.length; index += 2) {
    const heading = plainText(parts[index] ?? '') || title;
    const narration = plainText(parts[index + 1] ?? '');
    if (narration) slides.push({ title: heading, narration: narration.slice(0, 1100) });
  }
  if (!slides.length) slides.push({ title, narration: plainText(html).slice(0, 1100) || title });
  return slides.slice(0, 12);
}

function lessonExperience(contentJson: unknown, content: unknown) {
  const candidates = [contentJson, content];
  for (const candidate of candidates) {
    let record: Record<string, any> | null = null;
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      record = candidate as Record<string, any>;
    } else if (typeof candidate === 'string') {
      try {
        const parsed = JSON.parse(candidate);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) record = parsed;
      } catch {
        record = null;
      }
    }
    const experience = record?.experience;
    if (experience && typeof experience === 'object' && !Array.isArray(experience)) {
      return experience as Record<string, any>;
    }
  }
  return null;
}

function teachingSlidesFromExperience(
  title: string,
  html: string,
  experience: Record<string, any> | null,
): TeachingSlide[] {
  const readingGuide = experience?.readingGuide;
  const sections = Array.isArray(readingGuide?.sections) ? readingGuide.sections : [];
  const authored = sections
    .map((section: any) => ({
      title: plainText(String(section?.heading ?? '')),
      narration: plainText(String(section?.body ?? '')),
    }))
    .filter((slide: TeachingSlide) => slide.title && slide.narration);
  const summary = plainText(String(readingGuide?.summary ?? ''));
  if (summary) authored.unshift({ title, narration: summary });
  return authored.length ? authored.slice(0, 12) : teachingSlides(title, html);
}

function checkpointsFromTimeline(
  timeline: Record<string, any> | undefined,
  experience: Record<string, any> | null,
): Checkpoint[] {
  const events = Array.isArray(timeline?.events) ? timeline.events : [];
  const questions = Array.isArray(experience?.knowledgeChecks) ? experience.knowledgeChecks : [];
  let questionIndex = 0;
  return events.flatMap((event: any): Checkpoint[] => {
    const timestamp = Number(event?.at);
    if (!Number.isFinite(timestamp) || event?.required === false) return [];
    if (event.type === 'question') {
      const question = questions[questionIndex++];
      if (!question || !Array.isArray(question.options)) return [];
      return [
        {
          type: 'quiz',
          timestamp,
          question: String(question.question),
          options: question.options.map(String),
          answer: Number(question.correct ?? question.correctAnswer),
          explanation: question.explanation ? String(question.explanation) : undefined,
        },
      ];
    }
    if (event.type === 'remediation')
      return [
        { type: 'key-concept', timestamp, concept: `Required review: ${String(event.objective)}` },
      ];
    if (event.type === 'diagram')
      return [
        {
          type: 'key-concept',
          timestamp,
          concept: 'Review the required technical diagram before continuing.',
        },
      ];
    if (event.type === 'pause')
      return [
        {
          type: 'key-concept',
          timestamp,
          concept: 'Pause and confirm the demonstrated step before continuing.',
        },
      ];
    return [];
  });
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Resolve a signed administrator preview before enforcing learner login. Deployment checkpoint: preview handoff fix.
  // Course Builder preview handoffs are read-only and already validate the
  // issuing admin/staff actor, so forcing them through learner authentication
  // defeats the preview flow and causes the redirect loop.
  const preview = await resolveCoursePreview(courseId);
  if (!user && !preview.active)
    redirect(
      `/login?redirect=${encodeURIComponent(`/lms/courses/${courseId}/lessons/${lessonId}`)}`,
    );
  const db = preview.active ? preview.db : supabase;

  let courseQuery = db.from('courses').select('id,title,slug,is_active');
  if (!preview.active) courseQuery = courseQuery.eq('is_active', true);
  courseQuery = isUuid(courseId)
    ? courseQuery.eq('id', courseId)
    : courseQuery.eq('slug', courseId);
  const { data: course } = await courseQuery.maybeSingle();
  if (!course) notFound();

  if (!preview.active && user) {
    const { data: pacing, error: pacingError } = await supabase.rpc('get_my_course_pacing', {
      p_course_id: course.id,
    });
    if (pacingError) throw new Error('Unable to verify lesson release');
    if ((pacing as any)?.theoryWindow?.allowed === false)
      return (
        <main className="mx-auto max-w-4xl p-6">
          <Link href="/apprentice" className="font-bold underline">
            Back to dashboard
          </Link>
          <TheoryWindowNotice access={(pacing as any).theoryWindow} />
        </main>
      );
    const scheduled = (pacing as any)?.lessons?.find((item: any) => item.id === lessonId);
    if (scheduled && !scheduled.available)
      return (
        <main className="mx-auto max-w-3xl space-y-5 p-8">
          <Link href={`/lms/courses/${course.id}`} className="font-bold text-cyan-800">
            Back to course schedule
          </Link>
          <h1 className="text-3xl font-extrabold">{scheduled.title}</h1>
          <p className="rounded-xl border border-amber-300 bg-amber-50 p-5 font-semibold">
            {scheduled.published
              ? `This lesson opens in training week ${scheduled.releaseWeek}. Complete earlier required lessons before continuing.`
              : 'This lesson is still being produced and verified.'}
          </p>
          <p>
            Follow your {pacing.totalWeeks}-week plan. Assessment and supervised practical
            requirements still apply.
          </p>
        </main>
      );
    await assertLessonAccess(user.id, lessonId);
  }

  let lessonQuery = db
    .from('course_lessons')
    .select(
      'id,module_id,title,slug,content,content_json,rendered_html,video_url,video_config,duration_minutes,lesson_type,learning_objectives,quiz_questions,key_terms,passing_score,is_published,order_index',
    )
    .eq('id', lessonId)
    .eq('course_id', course.id);
  if (!preview.active) lessonQuery = lessonQuery.eq('is_published', true);
  const { data: lesson } = await lessonQuery.maybeSingle();
  if (!lesson) notFound();

  const [{ data: orderedLessons }, { data: moduleRow }, { data: lessonVisual }] = await Promise.all(
    [
      db
        .from('course_lessons')
        .select('id,title,order_index')
        .eq('course_id', course.id)
        .match(preview.active ? {} : { is_published: true })
        .order('order_index'),
      lesson.module_id
        ? db
            .from('course_modules')
            .select('order_index')
            .eq('id', lesson.module_id)
            .eq('course_id', course.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      db
        .from('course_visual_assets')
        .select('asset_url,poster_url,alt_text,caption,media_type,metadata')
        .eq('course_id', course.id)
        .eq('placement', 'lesson')
        .eq('is_active', true)
        .contains('metadata', { lesson_slug: lesson.slug })
        .order('sort_order')
        .limit(1)
        .maybeSingle(),
    ],
  );

  const lessonList = orderedLessons ?? [];
  const currentIndex = lessonList.findIndex((item) => item.id === lesson.id);
  const previous = currentIndex > 0 ? lessonList[currentIndex - 1] : null;
  const next =
    currentIndex >= 0 && currentIndex < lessonList.length - 1 ? lessonList[currentIndex + 1] : null;
  const objectives = Array.isArray(lesson.learning_objectives) ? lesson.learning_objectives : [];
  const questions = Array.isArray(lesson.quiz_questions) ? lesson.quiz_questions : [];
  const keyTerms = Array.isArray(lesson.key_terms) ? lesson.key_terms : [];
  const lessonHtml = htmlFromContent(lesson.content, lesson.rendered_html);
  const experience = lessonExperience(lesson.content_json, lesson.content);
  const interactiveVideo = experience?.interactiveVideo as Record<string, any> | undefined;
  const instructionalTimeline = experience?.instructionalTimeline as
    | Record<string, any>
    | undefined;
  const authoredVideoCheckpoints = Array.isArray(interactiveVideo?.checkpoints)
    ? (interactiveVideo.checkpoints as Checkpoint[])
    : [];
  const videoCheckpoints = authoredVideoCheckpoints.length
    ? authoredVideoCheckpoints
    : checkpointsFromTimeline(instructionalTimeline, experience);
  const videoTranscript =
    Array.isArray(interactiveVideo?.transcript) && interactiveVideo.transcript.length
      ? interactiveVideo.transcript
      : Array.isArray(instructionalTimeline?.captions) && instructionalTimeline.captions.length
        ? instructionalTimeline.captions
        : measuredLessonCues((lesson.content_json as any)?.film);
  const captionsUrl = [
    interactiveVideo?.captionsUrl,
    (lesson.content_json as any)?.film?.captionsUrl,
    (lesson.content_json as any)?.film?.sceneData?.captionUrl,
    experience?.film?.captionsUrl,
    experience?.film?.sceneData?.captionUrl,
    experience?.media?.caption_url,
  ].find((value): value is string => typeof value === 'string' && /^https:\/\//.test(value));
  const slides = teachingSlidesFromExperience(lesson.title, lessonHtml, experience);
  const videoConfig =
    lesson.video_config && typeof lesson.video_config === 'object'
      ? (lesson.video_config as Record<string, unknown>)
      : {};
  const assignedInstructor = getInstructorForCourse(course.title);
  const instructorName =
    typeof videoConfig.instructor === 'string' ? videoConfig.instructor : assignedInstructor.name;
  const instructorImage =
    typeof videoConfig.instructor_avatar === 'string'
      ? videoConfig.instructor_avatar
      : assignedInstructor.avatar;
  const lessonType = String(lesson.lesson_type ?? 'lesson');
  const passingScore = Number(lesson.passing_score ?? 80);
  const moduleOrder = Number(moduleRow?.order_index ?? 1);

  const lessonHeader = (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <Link
          href={`/lms/courses/${course.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-cyan-800 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {course.title}
        </Link>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-slate-600">
          {lessonType === 'exam'
            ? 'Final Exam'
            : lessonType === 'checkpoint'
              ? 'Module Checkpoint'
              : 'RTI Lesson'}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{lesson.title}</h1>
        <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-slate-700">
          <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
            <Clock3 className="h-4 w-4" /> {Number(lesson.duration_minutes ?? 0)} min
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-2 text-cyan-900">
            <Video className="h-4 w-4" />{' '}
            {lesson.video_url ? 'Instructor video' : 'Interactive instructor'}
          </span>
          {questions.length ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-2 text-emerald-900">
              <CheckCircle2 className="h-4 w-4" /> {questions.length} knowledge checks
            </span>
          ) : null}
        </div>
      </div>
    </header>
  );

  return (
    <LessonFocusShell header={lessonHeader}>
      <TheoryWindowBoundary courseId={course.id} readOnly={preview.active}>
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
          {preview.active ? (
            <div className="rounded-xl border border-amber-400 bg-amber-100 p-4 text-sm font-black text-amber-950">
              Admin draft preview · Completion, assessment, and progress writes are disabled.
            </div>
          ) : null}
          {lessonVisual?.media_type === 'image' ? (
            <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
              <img
                src={lessonVisual.asset_url}
                alt={lessonVisual.alt_text || lesson.title}
                className="h-40 w-full object-contain bg-slate-50 sm:h-48"
              />
              {lessonVisual.caption ? (
                <figcaption className="border-t border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
                  {lessonVisual.caption}
                </figcaption>
              ) : null}
            </figure>
          ) : null}

          {!lesson.video_url ? (
            <AITeachingPlayer
              courseTitle={course.title}
              lessonTitle={lesson.title}
              instructorName={instructorName}
              instructorImage={instructorImage}
              visualImage={lessonVisual?.asset_url ?? lessonVisual?.poster_url ?? undefined}
              slides={slides}
            />
          ) : null}

          {lesson.video_url ? (
            <section
              aria-label="Instructional lesson video"
              className="overflow-hidden rounded-3xl border border-neutral-700 bg-neutral-900 shadow-lg"
            >
              <div className="p-3">
                <InteractiveVideoPlayer
                  videoUrl={managedLessonPlaybackUrl(lesson.video_url, course.id, lesson.id)}
                  title={lesson.title}
                  lessonId={lesson.id}
                  courseId={course.id}
                  checkpoints={videoCheckpoints}
                  transcript={videoTranscript}
                  captionsUrl={
                    captionsUrl &&
                    managedLessonPlaybackUrl(captionsUrl, course.id, lesson.id) !== captionsUrl
                      ? `/api/courses/${course.id}/lessons/${lesson.id}/playback?asset=captions`
                      : captionsUrl
                  }
                  readOnly={preview.active}
                  learnerId={preview.active ? undefined : user?.id}
                />
                <div className="mt-4 rounded-xl bg-white p-4 text-slate-950">
                  <p className="font-bold">Finished watching?</p>
                  <p className="mt-1 text-sm">
                    Complete the required lesson activities and questions, then save your completion
                    below. Watching the video alone does not complete the lesson.
                  </p>
                  <a
                    href="#lesson-completion"
                    className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-cyan-800 px-4 py-2 font-bold text-white"
                  >
                    Go to lesson completion
                  </a>
                </div>
                {!preview.active ? (
                  <div id="theory-timeclock-slot" className="mt-4" />
                ) : (
                  <p className="mt-3 rounded-xl bg-amber-50 p-4 font-bold text-amber-950">
                    Theory Timeclock — Start and Stop are available in the learner's own lesson
                    session. Clocking is disabled in this read-only preview.
                  </p>
                )}
              </div>
            </section>
          ) : null}

          {objectives.length ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-xl font-extrabold">
                <BookOpen className="h-5 w-5 text-cyan-700" /> Learning objectives
              </h2>
              <ul className="mt-4 space-y-2 text-base font-medium leading-7 text-slate-800">
                {objectives.map((objective, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="font-extrabold text-cyan-700">•</span>
                    <span>{String(objective)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {lessonHtml ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-bold text-slate-950">Lesson reading</h2>
              <p className="mt-1 text-sm text-slate-600">Scroll inside this panel to continue reading.</p>
              <div
                role="region"
                aria-label="Lesson reading text"
                tabIndex={0}
                className="prose prose-slate mt-4 max-h-[28rem] max-w-none overflow-y-auto overscroll-contain pr-3 prose-headings:font-extrabold prose-p:font-medium prose-p:leading-7 prose-li:font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-700"
                dangerouslySetInnerHTML={{ __html: lessonHtml }}
              />
            </section>
          ) : (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-5 font-semibold text-amber-950">
              Lesson content is not available. Contact your instructor before marking this lesson
              complete.
            </section>
          )}

          {keyTerms.length ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-extrabold">Key terms</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {keyTerms.map((term, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-slate-100 px-3 py-2 text-sm font-bold text-slate-800"
                  >
                    {typeof term === 'string' ? term : JSON.stringify(term)}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {preview.active ? (
            <section
              id="lesson-completion"
              className="rounded-2xl border border-amber-300 bg-amber-50 p-6"
            >
              <h2 className="text-xl font-bold">Lesson completion — read-only preview</h2>
              <p className="mt-2">
                The learner completes required activities, passes any assessment, and selects Mark
                lesson complete or Submit assessment here. Enrollment, engagement, sequencing and
                instructor sign-off checks still apply.
              </p>
              <button
                type="button"
                disabled
                className="mt-4 rounded-lg bg-slate-300 px-4 py-3 font-bold text-slate-700"
              >
                Completion disabled in admin preview
              </button>
            </section>
          ) : (
            <>
              <InteractiveLessonExperience
                courseId={course.id}
                lessonSlug={lesson.slug}
                lessonId={lesson.id}
              />
              <LessonProgressClient
                courseId={course.id}
                lessonId={lesson.id}
                lessonType={lessonType}
                moduleOrder={moduleOrder}
                passingScore={passingScore}
                questions={questions.map((question: any, index: number) => ({
                  id: question.id || `q-${index + 1}`,
                  question: question.question || question.question_text || question.prompt,
                  options: question.options || question.choices || [],
                }))}
              />
            </>
          )}

          <nav className="flex flex-col justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
            {previous ? (
              <Link
                href={`/lms/courses/${course.id}/lessons/${previous.id}`}
                className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-900 hover:bg-slate-100"
              >
                ← {previous.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/lms/courses/${course.id}/lessons/${next.id}`}
                className="rounded-lg bg-cyan-700 px-5 py-3 text-right font-bold text-white hover:bg-cyan-800"
              >
                {next.title} →
              </Link>
            ) : (
              <Link
                href={`/lms/courses/${course.id}`}
                className="rounded-lg bg-cyan-700 px-5 py-3 font-bold text-white hover:bg-cyan-800"
              >
                Return to course
              </Link>
            )}
          </nav>
        </div>
      </TheoryWindowBoundary>
    </LessonFocusShell>
  );
}
