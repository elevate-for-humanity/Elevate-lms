#!/usr/bin/env npx tsx

import { generateLessonContent } from '../../lib/course-factory/content-generator';
import { getBlueprintBySlug } from '../../lib/course-factory/blueprint-loader';
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

  const blueprint = await getBlueprintBySlug(courseSlug);
  if (!blueprint) throw new Error(`Registered blueprint not found: ${courseSlug}`);
  const blueprintModule = blueprint.modules.find((courseModule) =>
    (courseModule.lessons ?? []).some((candidate) => candidate.slug === lessonSlug),
  );
  const blueprintLesson = blueprintModule?.lessons?.find(
    (candidate) => candidate.slug === lessonSlug,
  );
  if (!blueprintModule || !blueprintLesson) {
    throw new Error(`Blueprint lesson not found: ${lessonSlug}`);
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

  try {
    const generated = await generateLessonContent({
      lesson: blueprintLesson,
      moduleTitle: blueprintModule.title,
      courseTitle: blueprint.title,
      courseId: course.id,
      state: blueprint.state,
      checkpointNamespace: `${blueprint.id}:${blueprint.version}`,
      standardsBlock: [
        `Required domain: ${blueprintLesson.domainKey ?? blueprintModule.domainKey ?? blueprintModule.slug}`,
        `Required module competencies: ${(blueprintModule.competencies ?? []).map((competency) => competency.competencyKey).join(', ') || 'Apply the module objective'}`,
        `Blueprint lesson identity: ${blueprintLesson.slug} — ${blueprintLesson.title}`,
      ].join('\n'),
    });

    const { data: persisted, error: persistedError } = await db
      .from('course_lessons')
      .select('video_config,generation_status')
      .eq('id', lesson.id)
      .single();
    if (persistedError) throw persistedError;
    const videoConfig = persisted.video_config as Record<string, unknown> | null;
    if (!videoConfig?.source_fingerprint || persisted.generation_status !== 'generating') {
      throw new Error('Generated lesson did not persist its locked media contract');
    }

    const { data: mediaJobs, error: mediaError } = await db
      .from('video_jobs')
      .select('id,status,asset_kind')
      .eq('course_id', course.id)
      .eq('lesson_id', lesson.id)
      .eq('asset_kind', 'lesson');
    if (mediaError) throw mediaError;
    if (mediaJobs?.length !== 1) {
      throw new Error(`Expected one canonical lesson media job; found ${mediaJobs?.length ?? 0}`);
    }

    console.log(JSON.stringify({
      courseId: course.id,
      courseSlug,
      lessonId: lesson.id,
      lessonSlug,
      lessonTitle: lesson.title,
      generatedWords: generated.content.trim().split(/\s+/).length,
      assessmentQuestions: generated.quiz_questions.length,
      mediaJobId: mediaJobs[0].id,
      mediaStatus: mediaJobs[0].status,
      generationPausedRestored: originalGenerationPaused,
    }, null, 2));
  } finally {
    if (originalGenerationPaused) {
      const { error: restoreError } = await db
        .from('courses')
        .update({ generation_paused: true })
        .eq('id', course.id);
      if (restoreError) throw restoreError;
    }
  }

}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
