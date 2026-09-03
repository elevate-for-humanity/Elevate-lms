import type { SupabaseClient } from '@/lib/supabase';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getBlueprintBySlug } from './blueprint-loader';
import { compileAuthoredLessonExperience } from './authored-content-compiler';

function record(value: unknown): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value))
    return value as Record<string, any>;
  if (typeof value !== 'string') return {};
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
  } catch {
    return { html: value };
  }
  return {};
}

function htmlFrom(value: unknown, fallback?: unknown): string {
  const source = record(value);
  for (const candidate of [source.html, source.content, source.body, fallback]) {
    if (typeof candidate === 'string' && candidate.trim()) return candidate;
  }
  return '';
}

function specificSource(
  courseLesson: Record<string, any>,
  curriculumLesson?: Record<string, any>,
  blueprintLesson?: Record<string, any>,
) {
  const blueprintContent = record(blueprintLesson?.content);
  const curriculumContent = record(curriculumLesson?.content);
  const courseContent = record(courseLesson.content);
  const blueprintHtml = htmlFrom(blueprintContent);
  const curriculumHtml = htmlFrom(curriculumContent, curriculumLesson?.script_text);
  const courseHtml = htmlFrom(courseContent, courseLesson.rendered_html);
  const useBlueprint =
    blueprintHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim().length >= 500;
  const useCurriculum =
    !useBlueprint &&
    curriculumHtml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim().length >= 500;
  const selectedContent = useBlueprint
    ? blueprintContent
    : useCurriculum
      ? curriculumContent
      : courseContent;
  return {
    html: useBlueprint ? blueprintHtml : useCurriculum ? curriculumHtml : courseHtml,
    content: selectedContent,
    objectives: useBlueprint
      ? (blueprintLesson?.learningObjectives ?? [blueprintLesson?.objective].filter(Boolean))
      : courseLesson.learning_objectives?.length
        ? courseLesson.learning_objectives
        : (curriculumContent.learning_objectives ?? curriculumContent.learningObjectives ?? []),
    questions: useBlueprint
      ? blueprintLesson?.quizQuestions
      : curriculumLesson?.quiz_questions?.length
        ? curriculumLesson.quiz_questions
        : courseLesson.quiz_questions,
    keyTerms: useBlueprint
      ? (blueprintContent.key_terms ?? blueprintContent.keyTerms ?? [])
      : curriculumLesson?.key_terms?.length
        ? curriculumLesson.key_terms
        : (courseLesson.key_terms ?? curriculumContent.key_terms ?? []),
    origin: useBlueprint
      ? 'repository_blueprint'
      : useCurriculum
        ? 'curriculum_lessons'
        : 'course_lessons',
  };
}

export async function upgradePersistedAuthoredCourse(courseId: string, client?: SupabaseClient) {
  const db = client ?? (await requireAdminClient());
  const { data: course, error: courseError } = await db
    .from('courses')
    .select('id,title,slug,program_id')
    .eq('id', courseId)
    .single();
  if (courseError || !course) throw courseError ?? new Error('Course not found');
  const blueprint = await getBlueprintBySlug(course.slug);
  const blueprintBySlug = new Map(
    (blueprint?.modules ?? [])
      .flatMap((courseModule) => courseModule.lessons ?? [])
      .map((lesson) => [lesson.slug, lesson as Record<string, any>]),
  );

  const { data: modules, error: moduleError } = await db
    .from('course_modules')
    .select('id,title,slug,domain_key,order_index')
    .eq('course_id', courseId)
    .order('order_index');
  if (moduleError) throw moduleError;

  const { data: lessons, error: lessonError } = await db
    .from('course_lessons')
    .select(
      'id,course_id,module_id,title,slug,content,content_json,rendered_html,learning_objectives,quiz_questions,key_terms,activities,resources,video_url,video_config,lesson_type,domain_key,approved,is_published,order_index',
    )
    .eq('course_id', courseId)
    .order('order_index');
  if (lessonError) throw lessonError;
  if (!lessons?.length) throw new Error(`${course.title}: no persisted lessons found`);

  let curriculumQuery = db
    .from('curriculum_lessons')
    .select(
      'lesson_slug,lesson_title,module_title,content,script_text,summary_text,key_terms,quiz_questions,resources,job_application,competency_checks',
    )
    .order('module_order')
    .order('lesson_order');
  curriculumQuery = course.program_id
    ? curriculumQuery.eq('program_id', course.program_id)
    : curriculumQuery.eq('course_id', courseId);
  const { data: curriculumRows, error: curriculumError } = await curriculumQuery;
  if (curriculumError) throw curriculumError;
  const curriculumBySlug = new Map((curriculumRows ?? []).map((item) => [item.lesson_slug, item]));
  const modulesById = new Map((modules ?? []).map((item) => [item.id, item]));

  // Compile every lesson before the transaction. One invalid lesson blocks the
  // entire course, so a repair can never leave a half-upgraded publication.
  const payload = lessons.map((lesson) => {
    const module = modulesById.get(lesson.module_id);
    if (!module) throw new Error(`${lesson.title}: module is missing`);
    const source = specificSource(
      lesson,
      curriculumBySlug.get(lesson.slug),
      blueprintBySlug.get(lesson.slug),
    );
    const currentContent = record(lesson.content);
    const currentJson = record(lesson.content_json);
    const compiled = compileAuthoredLessonExperience({
      courseTitle: course.title,
      moduleTitle: module.title,
      lessonTitle: lesson.title,
      lessonSlug: lesson.slug,
      domainKey: lesson.domain_key || module.domain_key || module.slug,
      html: source.html,
      learningObjectives: source.objectives,
      quizQuestions: source.questions,
      keyTerms: source.keyTerms,
      existingExperience: currentJson.experience ?? currentContent.experience,
    });
    const quickClips = compiled.experience.quickClips;
    return {
      id: lesson.id,
      content: {
        ...currentContent,
        html: source.html,
        learning_points: compiled.learningPoints,
        experience: compiled.experience,
        authored_source: source.origin,
      },
      content_json: { ...currentJson, experience: compiled.experience },
      rendered_html: source.html,
      learning_objectives: compiled.objectives,
      quiz_questions: compiled.questions,
      key_terms: compiled.experience.glossary,
      activities: [
        ...compiled.experience.exercises.map((exercise) => ({ type: 'exercise', ...exercise })),
        { type: 'practical', ...compiled.experience.practicalTask },
      ],
      resources: compiled.experience.resources,
      video_config: {
        ...record(lesson.video_config),
        enabled: true,
        ai_instructor: true,
        narration: compiled.experience.narrationScript,
        transcript: compiled.experience.narrationScript,
        visual_prompt: compiled.experience.visualPrompt,
        quick_clips: quickClips,
        captions: true,
      },
      script_text: compiled.experience.narrationScript,
      script: compiled.experience.narrationScript,
      bullet_points: compiled.learningPoints,
      scene_data: {
        visual_prompt: compiled.experience.visualPrompt,
        reading_guide: compiled.experience.readingGuide,
        scenario: compiled.experience.scenario,
        case_study: compiled.experience.caseStudy,
        quick_clips: quickClips,
        glossary: compiled.experience.glossary,
        readiness: compiled.experience.readiness,
      },
      generation_status: 'generated',
    };
  });

  const { data, error } = await db.rpc('apply_authored_course_experience_upgrade', {
    p_course_id: courseId,
    p_lessons: payload,
  });
  if (error) throw error;
  return {
    ok: true as const,
    courseId,
    courseSlug: course.slug,
    moduleCount: modules?.length ?? 0,
    lessonCount: payload.length,
    result: data,
  };
}
