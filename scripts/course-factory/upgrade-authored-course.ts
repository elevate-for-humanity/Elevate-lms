import { upgradePersistedAuthoredCourse } from '../../lib/course-factory/persisted-authored-upgrade';
import { requireAdminClient } from '../../lib/supabase/admin';

function argument(name: string): string | null {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? (process.argv[index + 1]?.trim() ?? null) : null;
}

function requiredCourseId(): string {
  const value = argument('course-id') ?? process.env.COURSE_ID?.trim();
  if (
    !value ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new Error('A valid --course-id UUID is required');
  }
  return value;
}

async function snapshot(courseId: string) {
  const db = await requireAdminClient();
  const [courseResult, lessonsResult] = await Promise.all([
    db
      .from('courses')
      .select('id,slug,status,is_active,published_at,review_status,reviewed_by,reviewed_at')
      .eq('id', courseId)
      .single(),
    db
      .from('course_lessons')
      .select('id,is_published,approved,video_url,content_json,script_text')
      .eq('course_id', courseId),
  ]);
  if (courseResult.error || !courseResult.data) {
    throw courseResult.error ?? new Error(`Course ${courseId} was not found`);
  }
  if (lessonsResult.error) throw lessonsResult.error;
  const lessons = lessonsResult.data ?? [];
  return {
    course: courseResult.data,
    lessonCount: lessons.length,
    lessonIds: lessons.map((lesson) => lesson.id).sort(),
    publishedLessons: lessons.filter((lesson) => lesson.is_published).length,
    approvedLessons: lessons.filter((lesson) => lesson.approved).length,
    videoLessonIds: lessons
      .filter((lesson) => Boolean(lesson.video_url))
      .map((lesson) => lesson.id)
      .sort(),
    interactiveLessons: lessons.filter((lesson) => {
      const value = lesson.content_json;
      return Boolean(
        value && typeof value === 'object' && !Array.isArray(value) && 'experience' in value,
      );
    }).length,
    scriptedLessons: lessons.filter((lesson) => Boolean(lesson.script_text?.trim())).length,
  };
}

function sameJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function main() {
  const courseId = requiredCourseId();
  const before = await snapshot(courseId);
  const result = await upgradePersistedAuthoredCourse(courseId);
  const after = await snapshot(courseId);

  if (!sameJson(before.course, after.course)) {
    throw new Error('Course publication or human-review identity changed during authored upgrade');
  }
  if (!sameJson(before.lessonIds, after.lessonIds)) {
    throw new Error('Stable lesson identities changed during authored upgrade');
  }
  if (before.publishedLessons !== after.publishedLessons) {
    throw new Error('Published lesson state changed during authored upgrade');
  }
  if (before.approvedLessons !== after.approvedLessons) {
    throw new Error('Lesson approval state changed during authored upgrade');
  }
  if (!sameJson(before.videoLessonIds, after.videoLessonIds)) {
    throw new Error('Existing lesson video ownership changed during authored upgrade');
  }
  if (
    after.lessonCount === 0 ||
    after.interactiveLessons !== after.lessonCount ||
    after.scriptedLessons !== after.lessonCount
  ) {
    throw new Error(
      `Incomplete authored upgrade: lessons=${after.lessonCount}, interactive=${after.interactiveLessons}, scripted=${after.scriptedLessons}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        courseId,
        slug: after.course.slug,
        modules: result.moduleCount,
        lessons: after.lessonCount,
        interactiveLessons: after.interactiveLessons,
        scriptedLessons: after.scriptedLessons,
        publishedLessons: after.publishedLessons,
        approvedLessons: after.approvedLessons,
        preservedVideos: after.videoLessonIds.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exit(1);
});
