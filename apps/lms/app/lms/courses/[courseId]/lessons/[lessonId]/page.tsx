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

  if (!user)
    redirect(
      `/login?redirect=${encodeURIComponent(`/lms/courses/${courseId}/lessons/${lessonId}`)}`,
    );

  let courseQuery = supabase
    .from('courses')
    .select('id,title,slug,is_active')
    .eq('is_active', true);
  courseQuery = isUuid(courseId)
    ? courseQuery.eq('id', courseId)
    : courseQuery.eq('slug', courseId);
  const { data: course } = await courseQuery.maybeSingle();
  if (!course) notFound();

  const { data: lesson } = await supabase
    .from('course_lessons')
    .select(
      'id,module_id,title,slug,content,content_json,rendered_html,video_url,video_config,duration_minutes,lesson_type,learning_objectives,quiz_questions,key_terms,passing_score,is_published,order_index',
    )
    .eq('id', lessonId)
    .eq('course_id', course.id)
    .eq('is_published', true)
    .maybeSingle();
  if (!lesson) notFound();

  const [{ data: orderedLessons }, { data: moduleRow }, { data: lessonVisual }] = await Promise.all(
    [
      supabase
        .from('course_lessons')
        .select('id,title,order_index')
        .eq('course_id', course.id)
        .eq('is_published', true)
        .order('order_index'),
      lesson.module_id
        ? supabase
            .from('course_modules')
            .select('order_index')
            .eq('id', lesson.module_id)
            .eq('course_id', course.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
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
  const passingScore = Number(lesson.passing_score ?? 70);
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
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
        {lessonVisual?.media_type === 'image' ? (
          <figure className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
            <img
              src={lessonVisual.asset_url}
              alt={lessonVisual.alt_text || lesson.title}
              className="aspect-video w-full object-contain bg-slate-50"
            />
            {lessonVisual.caption ? (
              <figcaption className="border-t border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700">
                {lessonVisual.caption}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        <AITeachingPlayer
          courseTitle={course.title}
          lessonTitle={lesson.title}
          instructorName={instructorName}
          instructorImage={instructorImage}
          visualImage={lessonVisual?.asset_url ?? lessonVisual?.poster_url ?? undefined}
          slides={slides}
        />

        {lesson.video_url ? (
          <details className="overflow-hidden rounded-3xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-orange-50 shadow-lg">
            <summary className="cursor-pointer px-6 py-4 font-extrabold text-cyan-950">
              Watch the produced lesson video
            </summary>
            <div className="border-t border-cyan-100 p-3">
              <video
                controls
                preload="metadata"
                playsInline
                poster={lessonVisual?.poster_url ?? lessonVisual?.asset_url ?? undefined}
                className="aspect-video w-full rounded-2xl bg-white"
                src={lesson.video_url}
              >
                Your browser does not support HTML video.
              </video>
            </div>
          </details>
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
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div
              className="prose prose-slate max-w-none prose-headings:font-extrabold prose-p:font-medium prose-p:leading-7 prose-li:font-medium"
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
          questions={questions as any[]}
        />

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
    </LessonFocusShell>
  );
}
