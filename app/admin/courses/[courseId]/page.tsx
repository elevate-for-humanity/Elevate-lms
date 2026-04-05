import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  startCourseGeneration,
  pauseCourseGeneration,
  resumeCourseGeneration,
  publishCourse,
  unpublishCourse,
  toggleLessonLock,
  approveLesson,
  unapproveLesson,
  saveLessonContent,
  regenerateLessonAction,
  deleteLesson,
} from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Course Builder | Admin | Elevate For Humanity',
};

// ── Status badge helpers ──────────────────────────────────────────────────────

const COURSE_STATUS_COLORS: Record<string, string> = {
  draft:      'bg-slate-100 text-slate-600',
  generating: 'bg-amber-100 text-amber-700',
  review:     'bg-blue-100 text-blue-700',
  published:  'bg-emerald-100 text-emerald-700',
};

const LESSON_STATUS_COLORS: Record<string, string> = {
  queued:     'bg-slate-100 text-slate-500',
  generating: 'bg-amber-100 text-amber-700',
  generated:  'bg-blue-100 text-blue-700',
  approved:   'bg-emerald-100 text-emerald-700',
};

// ── Data fetch ────────────────────────────────────────────────────────────────

async function getCourseWithLessons(courseId: string) {
  const db = createAdminClient();

  const { data: course, error } = await db
    .from('courses')
    .select(`
      id, title, slug, description, published, status,
      generation_status, generation_progress, generation_paused,
      generator_prompt, last_generated_at, updated_at
    `)
    .eq('id', courseId)
    .single();

  if (error || !course) return null;

  const { data: lessons } = await db
    .from('course_lessons')
    .select(`
      id, title, content, order_index,
      generation_status, locked, approved, ai_generated,
      generator_prompt, last_generated_at, updated_at
    `)
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  return { course, lessons: lessons ?? [] };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CourseBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireAdmin();
  const { courseId } = await params;
  const detail = await getCourseWithLessons(courseId);
  if (!detail) notFound();

  const { course, lessons } = detail;

  const genStatus    = (course as any).generation_status ?? 'draft';
  const genProgress  = (course as any).generation_progress ?? 0;
  const genPaused    = (course as any).generation_paused ?? false;
  const isGenerating = genStatus === 'generating' && !genPaused;

  const approvedCount = lessons.filter((l: any) => l.approved).length;
  const allApproved   = lessons.length > 0 && approvedCount === lessons.length;

  return (
    <div className="min-h-screen bg-white">

      {/* ── Header ── */}
      <div className="bg-brand-blue-700 text-white py-6 px-4">
        <div className="max-w-5xl mx-auto flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/admin/courses"
              className="text-brand-blue-200 hover:text-white text-sm"
            >
              ← Courses
            </Link>
            <h1 className="text-xl font-bold mt-1">{course.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${COURSE_STATUS_COLORS[genStatus] ?? 'bg-slate-100 text-slate-600'}`}>
                {genStatus}
              </span>
              {course.published && (
                <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700">
                  Live
                </span>
              )}
              <span className="text-brand-blue-200 text-xs">
                {approvedCount}/{lessons.length} lessons approved
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/courses/${courseId}/inspect`}
              className="rounded-lg bg-brand-blue-600 hover:bg-brand-blue-500 text-white px-3 py-1.5 text-sm font-medium"
            >
              Inspect
            </Link>
            <Link
              href={`/admin/courses/${courseId}/edit`}
              className="rounded-lg bg-brand-blue-600 hover:bg-brand-blue-500 text-white px-3 py-1.5 text-sm font-medium"
            >
              Edit Meta
            </Link>
            {course.published ? (
              <form action={unpublishCourse}>
                <input type="hidden" name="courseId" value={courseId} />
                <button className="rounded-lg bg-white text-brand-blue-700 hover:bg-brand-blue-50 px-3 py-1.5 text-sm font-medium">
                  Unpublish
                </button>
              </form>
            ) : (
              <form action={publishCourse}>
                <input type="hidden" name="courseId" value={courseId} />
                <button
                  disabled={!allApproved}
                  className="rounded-lg bg-white text-brand-blue-700 hover:bg-brand-blue-50 px-3 py-1.5 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                  title={allApproved ? 'Publish course' : 'Approve all lessons first'}
                >
                  Publish
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Generation progress bar ── */}
        {(isGenerating || genStatus === 'generating') && (
          <div className="bg-white rounded-xl border p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">
                {genPaused ? 'Generation paused' : 'Generating…'}
              </span>
              <span className="text-slate-500">{genProgress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${genProgress}%` }}
              />
            </div>
            {!genPaused && (
              <form action={pauseCourseGeneration}>
                <input type="hidden" name="courseId" value={courseId} />
                <button className="text-xs text-slate-500 hover:text-slate-700 underline">
                  Pause generation
                </button>
              </form>
            )}
            {genPaused && (
              <form action={resumeCourseGeneration}>
                <input type="hidden" name="courseId" value={courseId} />
                <button className="text-xs text-brand-blue-600 hover:text-brand-blue-800 underline font-medium">
                  Resume generation
                </button>
              </form>
            )}
          </div>
        )}

        {/* ── Generate panel (shown when draft or review) ── */}
        {(genStatus === 'draft' || genStatus === 'review') && (
          <div className="bg-white rounded-xl border p-5">
            <h2 className="text-base font-semibold text-slate-900 mb-1">
              {genStatus === 'review' ? 'Regenerate Course' : 'Generate Course Content'}
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              {genStatus === 'review'
                ? 'Re-run generation on unlocked lessons. Approved lessons will not be touched.'
                : 'Describe what this course should teach. The generator will create lessons one at a time and save each to the database as it goes.'}
            </p>
            <form action={startCourseGeneration} className="space-y-3">
              <input type="hidden" name="courseId" value={courseId} />
              <textarea
                name="prompt"
                required
                rows={4}
                defaultValue={(course as any).generator_prompt ?? course.description ?? ''}
                placeholder="Describe the course content, audience, and learning objectives…"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400"
              />
              <button
                type="submit"
                className="rounded-lg bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 text-sm font-semibold"
              >
                {genStatus === 'review' ? 'Regenerate unlocked lessons' : 'Start generation'}
              </button>
            </form>
          </div>
        )}

        {/* ── Lesson builder ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Lessons
              <span className="ml-2 text-sm font-normal text-slate-400">
                ({lessons.length})
              </span>
            </h2>
            {allApproved && lessons.length > 0 && (
              <span className="text-xs text-emerald-600 font-medium">
                ✅ All approved — ready to publish
              </span>
            )}
          </div>

          {lessons.length === 0 && (
            <div className="bg-white rounded-xl border p-8 text-center text-sm text-slate-500">
              {isGenerating
                ? 'Lessons are being generated…'
                : 'No lessons yet. Use the generator above or add lessons manually.'}
            </div>
          )}

          {lessons.map((lesson: any) => {
            const lStatus = lesson.generation_status ?? 'queued';
            return (
              <div
                key={lesson.id}
                className={`bg-white rounded-xl border p-5 space-y-4 ${lesson.locked ? 'border-amber-200' : ''}`}
              >
                {/* Lesson header */}
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-400 tabular-nums">
                        #{lesson.order_index}
                      </span>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${LESSON_STATUS_COLORS[lStatus] ?? 'bg-slate-100 text-slate-500'}`}>
                        {lStatus}
                      </span>
                      {lesson.locked && (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
                          Locked
                        </span>
                      )}
                      {lesson.ai_generated && (
                        <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700">
                          AI
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Lesson controls */}
                  <div className="flex flex-wrap gap-2">
                    {/* Lock / Unlock */}
                    <form action={toggleLessonLock}>
                      <input type="hidden" name="lessonId" value={lesson.id} />
                      <input type="hidden" name="courseId" value={courseId} />
                      <input type="hidden" name="locked"   value={lesson.locked ? 'false' : 'true'} />
                      <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">
                        {lesson.locked ? 'Unlock' : 'Lock'}
                      </button>
                    </form>

                    {/* Regenerate (only if unlocked and not approved) */}
                    {!lesson.locked && !lesson.approved && (
                      <form action={regenerateLessonAction}>
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <input type="hidden" name="courseId" value={courseId} />
                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">
                          Regenerate
                        </button>
                      </form>
                    )}

                    {/* Approve / Unapprove */}
                    {lesson.approved ? (
                      <form action={unapproveLesson}>
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <input type="hidden" name="courseId" value={courseId} />
                        <button className="rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-1.5 text-xs font-medium hover:bg-emerald-100">
                          Approved ✓
                        </button>
                      </form>
                    ) : (
                      <form action={approveLesson}>
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <input type="hidden" name="courseId" value={courseId} />
                        <button className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">
                          Approve
                        </button>
                      </form>
                    )}

                    {/* Delete */}
                    {!lesson.approved && (
                      <form action={deleteLesson}>
                        <input type="hidden" name="lessonId" value={lesson.id} />
                        <input type="hidden" name="courseId" value={courseId} />
                        <button className="rounded-lg border border-red-100 text-red-500 px-3 py-1.5 text-xs font-medium hover:bg-red-50">
                          Delete
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Editable lesson form */}
                <form action={saveLessonContent} className="space-y-3">
                  <input type="hidden" name="lessonId" value={lesson.id} />
                  <input type="hidden" name="courseId" value={courseId} />
                  <input
                    name="title"
                    defaultValue={lesson.title}
                    required
                    disabled={lesson.locked}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-blue-400 disabled:bg-slate-50 disabled:text-slate-400"
                    placeholder="Lesson title"
                  />
                  <textarea
                    name="content"
                    defaultValue={lesson.content ?? ''}
                    disabled={lesson.locked}
                    rows={lesson.content ? 10 : 4}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue-400 disabled:bg-slate-50 disabled:text-slate-400"
                    placeholder={
                      lStatus === 'queued' || lStatus === 'generating'
                        ? 'Content will appear here once generated…'
                        : 'Lesson content…'
                    }
                  />
                  {!lesson.locked && (
                    <button
                      type="submit"
                      className="rounded-lg bg-slate-900 hover:bg-slate-700 text-white px-4 py-1.5 text-xs font-semibold"
                    >
                      Save
                    </button>
                  )}
                </form>

                {lesson.last_generated_at && (
                  <p className="text-xs text-slate-400">
                    Last generated {new Date(lesson.last_generated_at).toLocaleString()}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
