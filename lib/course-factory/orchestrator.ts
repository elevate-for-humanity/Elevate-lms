/**
 * Canonical flexible Course Factory orchestration.
 *
 * This is the single free-form generation entry point used by the Admin Pipeline tab.
 * Low-level validation/persistence remains in the shared course compiler/pipeline modules,
 * while orchestration ownership lives here in Course Factory.
 */
import type { SupabaseClient } from '@/lib/supabase';
import { aiChat } from '@/lib/ai/ai-service';
import { getOnetSnapshot, searchOnetOccupations } from '@/lib/onet/client';
import { logger } from '@/lib/logger';
import { runCoursePublishPipeline, generateCourseCode } from '@/lib/course-builder/pipeline';
import type { CourseTemplate } from '@/lib/course-builder/schema';
import { queueCourseLessonVideos } from '@/lib/course-builder/video-queue';

export type PipelineStage =
  | 'blueprint'
  | 'parse'
  | 'validate'
  | 'lessons'
  | 'quizzes'
  | 'publish'
  | 'videos'
  | 'complete'
  | 'error';

export type PipelineInput = {
  title: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  programId: string;
  programSlug?: string;
  moduleCount?: number;
  lessonsPerModule?: number;
  includeVideos?: boolean;
  dryRun?: boolean;
  socCode?: string;
  complianceProfileKey?: string;
  db: SupabaseClient;
  onProgress?: (stage: PipelineStage, message: string) => void;
};

export type PipelineOutput = {
  success: boolean;
  courseId: string | null;
  courseCode: string | null;
  title: string;
  modulesGenerated: number;
  lessonsGenerated: number;
  lessonsWithQuizzes: number;
  videosQueued: number;
  errors: string[];
  dryRun: boolean;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);
}

function inferComplianceProfile(input: PipelineInput): string {
  if (input.complianceProfileKey) return input.complianceProfileKey;
  const signal = `${input.title} ${input.topic} ${input.programSlug ?? ''}`.toLowerCase();
  if (/(apprentice|apprenticeship|dol|rapids)/.test(signal)) return 'dol_apprenticeship';
  if (/(naadac|peer recovery|peer support|crs|prs)/.test(signal)) return 'naadac_peer_support';
  if (/(state board|licens|barber|cosmetolog|esthetic|nail)/.test(signal)) return 'state_board_strict';
  if (/(credential|certification|regulated|exam)/.test(signal)) return 'custom_regulated';
  return 'internal_basic';
}

async function resolveProgramSlug(input: PipelineInput): Promise<string> {
  if (input.programSlug) return input.programSlug;
  const { data, error } = await input.db
    .from('programs')
    .select('slug,title,code')
    .eq('id', input.programId)
    .maybeSingle();
  if (error) throw error;
  return data?.slug || slugify(data?.title || data?.code || input.title);
}

async function fetchCareerContext(topic: string, socCode?: string): Promise<string> {
  try {
    let soc = socCode;
    if (!soc) {
      const results = await searchOnetOccupations(topic, 1);
      soc = results[0]?.code;
    }
    if (!soc) return '';
    const snapshot = await getOnetSnapshot(soc);
    if (!snapshot) return '';
    return [
      `O*NET SOC ${snapshot.soc} — ${snapshot.title}`,
      `Description: ${snapshot.description}`,
      `Job Zone: ${snapshot.jobZoneTitle} — ${snapshot.jobZoneEducation}`,
      `Top Skills: ${snapshot.topSkills.join(', ')}`,
      `Core Knowledge: ${snapshot.topKnowledge.join(', ')}`,
      `Core Tasks: ${snapshot.coreTasks.join(' | ')}`,
      `Common Job Titles: ${snapshot.sampleTitles.join(', ')}`,
      `Registered Apprenticeship signal: ${snapshot.hasApprenticeships ? 'yes' : 'no'}`,
      snapshot.attribution,
    ].join('\n');
  } catch (error) {
    logger.warn('[course-factory] O*NET context unavailable; continuing without it', {
      error: error instanceof Error ? error.message : String(error),
    });
    return '';
  }
}

async function generateBlueprint(input: PipelineInput): Promise<CourseTemplate | null> {
  const moduleCount = Math.max(2, Math.min(12, input.moduleCount ?? 6));
  const lessonsPerModule = Math.max(2, Math.min(10, input.lessonsPerModule ?? 5));
  const programSlug = await resolveProgramSlug(input);
  const complianceProfileKey = inferComplianceProfile(input);
  input.onProgress?.('blueprint', 'Loading occupational context and generating blueprint…');
  const careerContext = await fetchCareerContext(input.topic, input.socCode);

  const response = await aiChat({
    model: 'gpt-4.1-mini',
    temperature: 0.35,
    maxTokens: 5000,
    messages: [
      {
        role: 'system',
        content: `You are a workforce curriculum architect. Return ONLY valid JSON.\nSchema:\n{\n  "title": string,\n  "slug": string,\n  "description": string,\n  "modules": [{\n    "title": string, "slug": string, "order": number,\n    "lessons": [{ "title": string, "slug": string, "type": "lesson"|"checkpoint"|"lab"|"assignment"|"exam", "order": number, "description": string }]\n  }]\n}\nRules:\n- exactly ${moduleCount} modules\n- approximately ${lessonsPerModule} lesson rows per module\n- every module ends with a checkpoint\n- final module ends with an exam\n- all slugs are globally unique lowercase kebab-case\n- job-ready content, no placeholders\n- align to occupational context when supplied`,
      },
      {
        role: 'user',
        content: `Build a ${input.difficulty} course titled "${input.title}" about "${input.topic}". Program: ${programSlug}. Compliance profile: ${complianceProfileKey}.\n${careerContext}`,
      },
    ],
  });

  if (!response.content) return null;
  try {
    const parsed = JSON.parse(response.content.replace(/^```json\n?|\n?```$/g, '').trim());
    if (!Array.isArray(parsed.modules) || parsed.modules.length === 0) return null;

    const modules = parsed.modules.map((module: any, moduleIndex: number) => ({
      slug: slugify(module.slug || module.title || `module-${moduleIndex + 1}`),
      title: String(module.title || `Module ${moduleIndex + 1}`),
      order: Number(module.order ?? moduleIndex + 1),
      orderIndex: Number(module.order ?? moduleIndex + 1),
      domainKey: slugify(module.slug || module.title || `module-${moduleIndex + 1}`),
      targetHours: 0,
      quizRequired: true,
      practicalRequired: Array.isArray(module.lessons)
        ? module.lessons.some((lesson: any) => ['lab', 'assignment'].includes(lesson.type))
        : false,
      lessons: (Array.isArray(module.lessons) ? module.lessons : []).map(
        (lesson: any, lessonIndex: number) => ({
          slug: slugify(
            lesson.slug || `${module.slug || module.title}-${lesson.title || lessonIndex + 1}`,
          ),
          title: String(lesson.title || `Lesson ${lessonIndex + 1}`),
          type: ['lesson', 'checkpoint', 'lab', 'assignment', 'exam'].includes(lesson.type)
            ? lesson.type
            : 'lesson',
          order: Number(lesson.order ?? lessonIndex + 1),
          orderIndex: Number(lesson.order ?? lessonIndex + 1),
          lessonType: ['lesson', 'checkpoint', 'lab', 'assignment', 'exam'].includes(
            lesson.type,
          )
            ? lesson.type
            : 'lesson',
          description: String(lesson.description || ''),
          durationMinutes: lesson.type === 'exam' ? 90 : lesson.type === 'checkpoint' ? 30 : 30,
          learningObjectives: [
            `Demonstrate job-ready understanding of ${String(lesson.title || 'this lesson')}`,
          ],
          content: '',
          passingScore: lesson.type === 'exam' ? 75 : lesson.type === 'checkpoint' ? 70 : undefined,
        }),
      ),
    }));

    const estimatedMinutes = modules.reduce(
      (total: number, module: any) =>
        total + module.lessons.reduce((sum: number, lesson: any) => sum + (lesson.durationMinutes ?? 0), 0),
      0,
    );

    return {
      title: String(parsed.title || input.title),
      slug: slugify(parsed.slug || input.title),
      courseSlug: `${slugify(parsed.slug || input.title)}-${Date.now().toString(36)}`,
      programSlug,
      description: String(parsed.description || input.topic),
      programId: input.programId,
      credentialTarget:
        complianceProfileKey === 'dol_apprenticeship'
          ? 'DOL_APPRENTICESHIP'
          : complianceProfileKey === 'state_board_strict'
            ? 'STATE_BOARD'
            : 'INTERNAL',
      minimumHours: Math.max(1, estimatedMinutes / 60),
      requiresFinalExam: true,
      finalExam: { required: true, questionCount: 25, passingScore: 75 },
      certificateRequirements: {
        includeHours: true,
        includeCompetencies: complianceProfileKey !== 'internal_basic',
        includeInstructorVerification: complianceProfileKey !== 'internal_basic',
        includeCompletionDate: true,
        includeVerificationUrl: true,
      },
      regulatory: {
        complianceProfileKey,
        credentialTarget:
          complianceProfileKey === 'dol_apprenticeship'
            ? 'DOL_APPRENTICESHIP'
            : complianceProfileKey === 'state_board_strict'
              ? 'STATE_BOARD'
              : 'INTERNAL',
      },
      modules,
    } as CourseTemplate;
  } catch (error) {
    logger.error('[course-factory] Blueprint JSON parse failed', error);
    return null;
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function runWorker() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => runWorker()));
  return results;
}

async function enrichContent(template: CourseTemplate, input: PipelineInput): Promise<CourseTemplate> {
  const moduleResults = await mapWithConcurrency(template.modules, 3, async (module) => {
    const lessons = await mapWithConcurrency(module.lessons, 4, async (lesson) => {
      if (lesson.type === 'checkpoint' || lesson.type === 'exam') return lesson;
      try {
        const response = await aiChat({
          model: 'gpt-4.1-mini',
          temperature: 0.45,
          maxTokens: 1200,
          messages: [
            {
              role: 'system',
              content:
                'Write job-ready lesson content in semantic HTML using h2, h3, p, ul and ol. Include safety/compliance context where relevant. Return only HTML.',
            },
            {
              role: 'user',
              content: `Course: ${template.title}\nModule: ${module.title}\nLesson: ${lesson.title}\nDescription: ${lesson.description || ''}\nWrite 500-800 words with concrete examples and a brief practice activity.`,
            },
          ],
        });
        return {
          ...lesson,
          content: response.content || lesson.content || '',
          renderedHtml: response.content || lesson.content || '',
        };
      } catch (error) {
        logger.warn('[course-factory] Lesson enrichment failed; retaining draft lesson', {
          lesson: lesson.slug,
          error: error instanceof Error ? error.message : String(error),
        });
        return lesson;
      }
    });
    return { ...module, lessons };
  });
  input.onProgress?.('lessons', 'Lesson content generation complete.');
  return { ...template, modules: moduleResults };
}

async function hydrateAssessments(
  template: CourseTemplate,
  input: PipelineInput,
): Promise<CourseTemplate> {
  let assessmentCount = 0;
  const modules = await mapWithConcurrency(template.modules, 3, async (module) => {
    const lessons = await mapWithConcurrency(module.lessons, 3, async (lesson) => {
      if (lesson.type !== 'checkpoint' && lesson.type !== 'exam') return lesson;
      const questionCount = lesson.type === 'exam' ? 25 : 10;
      try {
        const response = await aiChat({
          model: 'gpt-4.1-mini',
          temperature: 0.25,
          maxTokens: lesson.type === 'exam' ? 5000 : 2500,
          messages: [
            {
              role: 'system',
              content: `Return ONLY a JSON array of ${questionCount} multiple-choice questions. Each item: {"question":string,"options":[string,string,string,string],"correctAnswer":number,"explanation":string}.`,
            },
            {
              role: 'user',
              content: `Create ${questionCount} job-relevant ${lesson.type} questions for ${template.title}, module ${module.title}.`,
            },
          ],
        });
        const questions = JSON.parse(
          (response.content || '[]').replace(/^```json\n?|\n?```$/g, '').trim(),
        );
        assessmentCount += 1;
        return {
          ...lesson,
          quizQuestions: Array.isArray(questions)
            ? questions.map((question: any, index: number) => ({
                id: `${lesson.slug}-q${index + 1}`,
                question: String(question.question || ''),
                options: Array.isArray(question.options) ? question.options.slice(0, 4) : [],
                correctAnswer: Number(question.correctAnswer ?? 0),
                explanation: String(question.explanation || ''),
              }))
            : [],
          passingScore: lesson.type === 'exam' ? 75 : 70,
        };
      } catch (error) {
        logger.warn('[course-factory] Assessment hydration failed', {
          lesson: lesson.slug,
          error: error instanceof Error ? error.message : String(error),
        });
        return lesson;
      }
    });
    return { ...module, lessons };
  });
  input.onProgress?.('quizzes', `Generated assessment banks for ${assessmentCount} lesson(s).`);
  return { ...template, modules };
}

export async function runCoursePipeline(input: PipelineInput): Promise<PipelineOutput> {
  const dryRun = input.dryRun ?? false;
  const errors: string[] = [];
  try {
    const template = await generateBlueprint(input);
    if (!template) {
      return {
        success: false,
        courseId: null,
        courseCode: null,
        title: input.title,
        modulesGenerated: 0,
        lessonsGenerated: 0,
        lessonsWithQuizzes: 0,
        videosQueued: 0,
        errors: ['Blueprint generation failed'],
        dryRun,
      };
    }

    input.onProgress?.(
      'blueprint',
      `Blueprint ready: ${template.modules.length} modules and ${template.modules.reduce((sum, module) => sum + module.lessons.length, 0)} lesson rows.`,
    );

    input.onProgress?.('lessons', 'Generating lesson content…');
    const withContent = await enrichContent(template, input);

    input.onProgress?.('quizzes', 'Generating checkpoint and final-exam banks…');
    const hydrated = await hydrateAssessments(withContent, input);

    input.onProgress?.('validate', 'Validating the course before persistence…');
    input.onProgress?.(
      'publish',
      dryRun ? 'Dry run: validating without database writes…' : 'Persisting canonical course draft…',
    );

    const result = await runCoursePublishPipeline({
      template: hydrated,
      db: input.db,
      mode: 'missing-only',
      dryRun,
    });
    if (!result.success) errors.push(...result.errors);

    const assessments = hydrated.modules.reduce(
      (sum, module) =>
        sum + module.lessons.filter((lesson) => ['checkpoint', 'exam'].includes(lesson.type)).length,
      0,
    );

    let videosQueued = 0;
    if (input.includeVideos && result.courseId && !dryRun) {
      input.onProgress?.('videos', 'Queuing missing lesson videos…');
      try {
        const videoResult = await queueCourseLessonVideos({
          courseId: result.courseId,
          onlyMissing: true,
        });
        videosQueued = videoResult.queued ?? 0;
        if (videoResult.failed) {
          errors.push(`${videoResult.failed} video job(s) failed to queue; course draft remains valid.`);
        }
      } catch (error) {
        errors.push(
          `Video queue failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    const courseCode = result.courseId
      ? generateCourseCode(hydrated.courseSlug || hydrated.slug || input.title)
      : null;
    input.onProgress?.(
      'complete',
      result.success
        ? dryRun
          ? 'Dry-run validation complete.'
          : `Course draft persisted: ${result.courseId}`
        : 'Pipeline completed with validation errors.',
    );

    return {
      success: result.success,
      courseId: result.courseId,
      courseCode,
      title: hydrated.title,
      modulesGenerated: hydrated.modules.length,
      lessonsGenerated: result.lessonsWritten,
      lessonsWithQuizzes: assessments,
      videosQueued,
      errors,
      dryRun,
    };
  } catch (error) {
    logger.error('[course-factory] Flexible pipeline failed', error);
    return {
      success: false,
      courseId: null,
      courseCode: null,
      title: input.title,
      modulesGenerated: 0,
      lessonsGenerated: 0,
      lessonsWithQuizzes: 0,
      videosQueued: 0,
      errors: [error instanceof Error ? error.message : String(error)],
      dryRun,
    };
  }
}
