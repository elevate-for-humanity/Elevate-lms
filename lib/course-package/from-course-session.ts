import { CoursePackageSchema, type CoursePackage } from './contract';
import type { CourseSession, StudioLesson } from '@/lib/studio/course-session';

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function lessonHtml(lesson: StudioLesson): string {
  if (lesson.rendered_html?.trim()) return lesson.rendered_html;
  if (typeof lesson.content === 'string') return lesson.content;
  const content = record(lesson.content);
  for (const key of ['html', 'content', 'body', 'text']) {
    if (typeof content?.[key] === 'string') return String(content[key]);
  }
  return '';
}

function lessonExperience(lesson: StudioLesson): Record<string, unknown> | null {
  const contentJson = record(lesson.content_json);
  const content = record(lesson.content);
  return record(contentJson?.experience) ?? record(content?.experience);
}

function normalizeQuestions(lesson: StudioLesson, domainKey: string | null) {
  if (!Array.isArray(lesson.quiz_questions)) return [];
  return lesson.quiz_questions.flatMap((value, index) => {
    const question = record(value);
    if (!question) return [];
    const prompt = String(question.question ?? question.question_text ?? '').trim();
    const options = Array.isArray(question.options) ? question.options.map(String) : [];
    const rawCorrect = question.correctAnswer ?? question.correct_answer ?? question.correct;
    const explanation = String(question.explanation ?? question.rationale ?? '').trim();
    if (!prompt || rawCorrect === undefined || !explanation) return [];
    const objectiveIds = Array.isArray(question.objectiveIds)
      ? question.objectiveIds.map(String).filter(Boolean)
      : [`${lesson.slug}-objective-${Math.min(index + 1, Math.max(1, lesson.learning_objectives?.length ?? 1))}`];
    return [{
      id: String(question.id ?? `${lesson.slug}-question-${index + 1}`),
      type: String(question.type ?? 'single-choice'),
      prompt,
      options,
      correctAnswers: Array.isArray(rawCorrect) ? rawCorrect : [rawCorrect],
      explanation,
      objectiveIds,
      domainKey: String(question.domainKey ?? domainKey ?? 'general'),
      difficulty: String(question.difficulty ?? 'application'),
      ...(question.source ? { source: String(question.source) } : {}),
    }];
  });
}

export function coursePackageFromSession(session: CourseSession): CoursePackage {
  const modules = [...session.modules]
    .sort((a, b) => a.order_index - b.order_index)
    .map((module) => ({
      id: module.id,
      slug: module.slug || module.id,
      title: module.title,
      description: module.description,
      domainKey: module.domain_key,
      order: module.order_index,
      required: module.is_required,
      lessons: session.lessons
        .filter((lesson) => lesson.module_id === module.id)
        .sort((a, b) => a.order_index - b.order_index)
        .map((lesson) => {
          const experience = lessonExperience(lesson);
          const interactiveVideo = record(experience?.interactiveVideo);
          const videoConfig = record(lesson.video_config);
          const storyboard = Array.isArray(videoConfig?.storyboard)
            ? videoConfig.storyboard
            : Array.isArray(videoConfig?.scenes)
              ? videoConfig.scenes
              : [];
          const timeline = record(videoConfig?.timeline);
          const requiredInteractionIds = [
            ...(Array.isArray(experience?.knowledgeChecks) ? [`${lesson.slug}-kc`] : []),
            ...(experience?.scenario ? [`${lesson.slug}-scenario`] : []),
            ...(experience?.caseStudy ? [`${lesson.slug}-case`] : []),
            ...(experience?.hotspots ? [`${lesson.slug}-hotspots`] : []),
            ...(experience?.dragDrop ? [`${lesson.slug}-drag-drop`] : []),
            ...(experience?.matching ? [`${lesson.slug}-matching`] : []),
            ...(experience?.simulation ? [`${lesson.slug}-simulation`] : []),
            ...(experience?.interactiveVideo ? [`${lesson.slug}-video`] : []),
          ];
          return {
            id: lesson.id,
            slug: lesson.slug,
            title: lesson.title,
            type: lesson.lesson_type,
            order: lesson.order_index,
            durationMinutes: Number(lesson.duration_minutes ?? 0),
            objectives: Array.isArray(lesson.learning_objectives)
              ? lesson.learning_objectives.map(String).filter(Boolean)
              : [],
            competencies: Array.isArray(lesson.competency_checks)
              ? lesson.competency_checks.flatMap((value, index) => {
                  const check = record(value);
                  if (!check) return [];
                  const objective = String(check.objective ?? check.description ?? '').trim();
                  if (!objective) return [];
                  return [{
                    id: String(check.id ?? `${lesson.slug}-competency-${index + 1}`),
                    domain: String(check.domain ?? check.domainKey ?? module.domain_key ?? 'general'),
                    objective,
                    requiredKnowledge: Array.isArray(check.requiredKnowledge)
                      ? check.requiredKnowledge.map(String).filter(Boolean)
                      : [objective],
                    assessmentStandard: String(check.assessmentStandard ?? check.standard ?? 'Demonstrate mastery through the configured lesson assessment.'),
                  }];
                })
              : [],
            html: lessonHtml(lesson),
            videoUrl: lesson.video_url,
            experience,
            storyboard,
            timeline,
            questions: normalizeQuestions(lesson, module.domain_key),
            completion: {
              required: lesson.is_required,
              minimumSeatTimeSeconds: Number(interactiveVideo?.minimumSeatTimeSeconds ?? 0),
              requiredWatchPercent: Number(interactiveVideo?.requiredWatchPercent ?? (lesson.video_url ? 95 : 0)),
              requiredInteractionIds,
              passingScore: Number(lesson.passing_score ?? 80),
              instructorSignoffRequired: lesson.requires_instructor_signoff,
              evidenceRequired: lesson.practical_required || Boolean(lesson.required_artifacts?.length),
            },
            published: lesson.is_published,
            approved: lesson.approved,
          };
        }),
    }));

  return CoursePackageSchema.parse({
    schemaVersion: '1.0',
    id: session.course.id,
    slug: session.course.slug,
    title: session.course.title,
    description: session.course.description,
    status: session.course.status,
    version: Number(session.course.version ?? 1),
    credential: {
      profileKey: session.course.compliance_profile_key,
      governingBody: session.course.governing_body,
      standardVersion: session.course.governing_standard_version,
    },
    evidence: { accessibility: null, learnerPreview: null },
    modules,
    generatedAt: new Date().toISOString(),
  });
}
