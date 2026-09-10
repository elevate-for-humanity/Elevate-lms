#!/usr/bin/env npx tsx

import { queueCourseMedia } from '../../lib/course-builder/orchestrator';
import { requireAdminClient } from '../../lib/supabase/admin';

const args = process.argv.slice(2);
const valueAfter = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

async function main() {
  const courseSlug = valueAfter('--course');
  const lessonSlug = valueAfter('--lesson');
  if (!courseSlug || !lessonSlug) {
    throw new Error('--course <course-slug> and --lesson <lesson-slug> are required');
  }

  const db = await requireAdminClient();
  const { data: lesson, error } = await db
    .from('course_lessons')
    .select('id,title,course_modules!inner(courses!inner(id,slug,is_active,status,generation_paused))')
    .eq('slug', lessonSlug)
    .eq('course_modules.courses.slug', courseSlug)
    .single();

  if (error || !lesson) throw error ?? new Error('Lesson not found');

  const course = (lesson.course_modules as any).courses;
  if (course.is_active === true || course.status === 'published') {
    throw new Error('One-lesson proof is restricted to an inactive draft course');
  }

  const originalGenerationPaused = course.generation_paused === true;
  if (originalGenerationPaused) {
    const { error: unpauseError } = await db
      .from('courses')
      .update({ generation_paused: false })
      .eq('id', course.id);
    if (unpauseError) throw unpauseError;
  }

  let result;
  try {
    result = await queueCourseMedia({
      courseId: course.id,
      lessonId: lesson.id,
      onlyMissing: false,
      force: true,
      limit: 1,
    });
  } finally {
    if (originalGenerationPaused) {
      const { error: restoreError } = await db
        .from('courses')
        .update({ generation_paused: true })
        .eq('id', course.id);
      if (restoreError) throw restoreError;
    }
  }

  if (result.queued !== 1 || result.failed !== 0) {
    throw new Error(`Expected exactly one queued lesson; queued=${result.queued} failed=${result.failed}`);
  }

  console.log(JSON.stringify({
    courseId: course.id,
    courseSlug,
    lessonId: lesson.id,
    lessonSlug,
    lessonTitle: lesson.title,
    queued: result.queued,
    failed: result.failed,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
