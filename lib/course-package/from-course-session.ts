import { CoursePackageSchema, type CoursePackage } from './contract';
import type { CourseSession, StudioLesson } from '@/lib/studio/course-session';
import { hasCanonicalMediaQualityEvidence } from '@/lib/course-factory/media-manager';
import { requireAdminClient } from '@/lib/supabase/admin';

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

export type CoursePackageEvidence = {
  accessibility: CoursePackage['evidence']['accessibility'];
  learnerPreview: CoursePackage['evidence']['learnerPreview'];
  mediaByLesson?: Map<string, {
    source: 'envato' | 'owned';
    licenseStatus: 'verified_paid' | 'owned';
    licenseEvidenceUrl?: string;
    matchScore: number;
  }>;
};

export function coursePackageFromSession(
  session: CourseSession,
  evidence: CoursePackageEvidence = { accessibility: null, learnerPreview: null },
): CoursePackage {
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
          const sceneData = record(lesson.scene_data);
          const rawStoryboard = Array.isArray(sceneData?.scenes)
            ? sceneData.scenes
            : Array.isArray(videoConfig?.storyboard)
              ? videoConfig.storyboard
              : Array.isArray(videoConfig?.scenes)
                ? videoConfig.scenes
                : [];
          const storyboard = rawStoryboard.map((value, index) => {
            const scene = record(value) ?? {};
            const onScreenTextValue = scene.onScreenText ?? scene.on_screen_text;
            return {
              objectiveId: String(
                scene.objectiveId ??
                  scene.objective_id ??
                  `${lesson.slug}-objective-${index + 1}`,
              ),
              sceneNumber: Number(scene.sceneNumber ?? scene.scene_number ?? index + 1),
              narration: String(scene.narration ?? scene.dialogue ?? ''),
              visualDirection: String(
                scene.visualDirection ?? scene.visual_style ?? scene.action ?? '',
              ),
              onScreenText: Array.isArray(onScreenTextValue)
                ? onScreenTextValue.map(String)
                : [],
              ...(scene.demonstration ? { demonstration: String(scene.demonstration) } : {}),
              durationSeconds: Math.max(
                1,
                Number(scene.durationSeconds ?? scene.duration_seconds ?? 1),
              ),
              ...(scene.interactionAfterScene ?? scene.interaction_after_scene
                ? {
                    interactionAfterScene: String(
                      scene.interactionAfterScene ?? scene.interaction_after_scene,
                    ),
                  }
                : {}),
            };
          });
          const experienceTimeline = record(experience?.instructionalTimeline);
          const sceneTimeline =
            sceneData && Array.isArray(sceneData.scenes)
              ? {
                  durationSeconds: (sceneData.scenes as unknown[]).reduce(
                    (total, value) => total + Math.max(0, Number((record(value) ?? {}).duration_seconds ?? 0)),
                    0,
                  ),
                  scenes: sceneData.scenes,
                  captions: Array.isArray(sceneData.captions) ? sceneData.captions : [],
                }
              : null;
          const effectiveTimeline = experienceTimeline ?? sceneTimeline;
          const timeline = record(videoConfig?.timeline) ?? (
            effectiveTimeline
              ? {
                  durationSeconds: effectiveTimeline.durationSeconds,
                  audio: Array.isArray(effectiveTimeline.scenes)
                    ? effectiveTimeline.scenes.map((scene, index) => {
                        const item = record(scene) ?? {};
                        return {
                          id: String(item.id ?? `${lesson.slug}-audio-${index + 1}`),
                          start: Number(item.startTime ?? 0),
                          end: Number(item.endTime ?? 0),
                          narration: String(item.narration ?? ''),
                        };
                      })
                    : [],
                  visuals: Array.isArray(effectiveTimeline.scenes)
                    ? effectiveTimeline.scenes.map((scene, index) => {
                        const item = record(scene) ?? {};
                        return {
                          id: String(item.id ?? `${lesson.slug}-visual-${index + 1}`),
                          start: Number(item.startTime ?? 0),
                          end: Number(item.endTime ?? 0),
                          direction: String(item.visualDirection ?? ''),
                          narrationCueIds: [String(item.id ?? `${lesson.slug}-audio-${index + 1}`)],
                          teachingPurpose: String(item.purpose ?? ''),
                          searchTerms: [],
                          // Production evidence is attached only after the
                          // canonical media job has passed quality review.
                          ...(evidence.mediaByLesson?.get(lesson.id) ?? {}),
                          visualType: item.visualType === 'technical-diagram' ? 'diagram' : 'video',
                        };
                      })
                    : [],
                  captions: Array.isArray(effectiveTimeline.captions)
                    ? effectiveTimeline.captions
                    : [],
                  interactions: [],
                  checkpoints: [],
                }
              : null
          );
          const persistedCompetencies = Array.isArray(lesson.competency_checks)
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
                  assessmentStandard: String(
                    check.assessmentStandard ??
                      check.standard ??
                      'Demonstrate mastery through the configured lesson assessment.',
                  ),
                }];
              })
            : [];
          const intelligenceSkills = Array.isArray(record(experience?.intelligence)?.skills)
            ? ((record(experience?.intelligence)?.skills as unknown[]) ?? [])
            : [];
          const inferredCompetencies = intelligenceSkills.flatMap((value, index) => {
            const skill = record(value);
            if (!skill) return [];
            const objective = String(skill.label ?? skill.key ?? '').trim();
            if (!objective) return [];
            return [{
              id: String(skill.key ?? `${lesson.slug}-competency-${index + 1}`),
              domain: String(lesson.domain_key ?? module.domain_key ?? 'general'),
              objective,
              requiredKnowledge: [objective],
              assessmentStandard:
                'Demonstrate mastery through the configured lesson assessment and practical evidence.',
            }];
          });
          const competencies = persistedCompetencies.length
            ? persistedCompetencies
            : inferredCompetencies;

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
            competencies,
            html: lessonHtml(lesson),
            videoUrl:
              lesson.video_status === 'complete' &&
              lesson.media_quality_status === 'approved' &&
              lesson.video_url
                ? lesson.video_url
                : null,
            experience,
            practicalRequired: lesson.practical_required === true,
            requiredArtifacts: Array.isArray(lesson.required_artifacts) ? lesson.required_artifacts.map(String).filter(Boolean) : [],
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
    evidence,
    modules,
    generatedAt: new Date().toISOString(),
  });
}


/**
 * Persisted production evidence is derived only from completed canonical media
 * jobs and explicit course review. Authored metadata cannot manufacture these
 * approvals.
 */
export async function loadPersistedCoursePackageEvidence(
  courseId: string,
): Promise<CoursePackageEvidence> {
  const db = await requireAdminClient();
  const [
    { data: jobs, error: jobsError },
    { data: course, error: courseError },
    { data: lessons, error: lessonsError },
    { data: visualAssets, error: visualAssetsError },
  ] = await Promise.all([
    db
      .from('video_jobs')
      .select('lesson_id,quality_evidence,status,review_status,video_url')
      .eq('course_id', courseId)
      .eq('asset_kind', 'lesson'),
    db
      .from('courses')
      .select('review_status,reviewed_at,reviewed_by,version')
      .eq('id', courseId)
      .maybeSingle(),
    db
      .from('course_lessons')
      .select('id,lesson_type,content_json,video_url,is_required')
      .eq('course_id', courseId),
    db
      .from('course_visual_assets')
      .select('id,media_type,alt_text,is_active,placement')
      .eq('course_id', courseId)
      .eq('is_active', true),
  ]);
  if (jobsError) throw jobsError;
  if (courseError) throw courseError;
  if (lessonsError) throw lessonsError;
  if (visualAssetsError) throw visualAssetsError;

  const lessonJobs = jobs ?? [];
  const requiredLessons = (lessons ?? []).filter((lesson) => lesson.is_required !== false);
  const mediaEvidenceApproved =
    lessonJobs.length > 0 &&
    lessonJobs.every(
      (job) =>
        job.status === 'complete' &&
        job.review_status === 'approved' &&
        hasCanonicalMediaQualityEvidence(job.quality_evidence),
    );
  const lessonAccessibilityApproved = requiredLessons.every((lesson) => {
    const contentJson = record(lesson.content_json);
    const experience = record(contentJson?.experience);
    if (['checkpoint', 'quiz', 'exam', 'final_exam', 'assessment'].includes(String(lesson.lesson_type))) {
      return true;
    }
    const timeline = record(experience?.instructionalTimeline);
    const captions = Array.isArray(timeline?.captions) ? timeline?.captions : [];
    const transcript = String(experience?.transcript ?? experience?.narrationScript ?? '').trim();
    return Boolean(transcript && captions.length > 0);
  });
  const activeLessonImages = (visualAssets ?? []).filter(
    (asset) => asset.media_type === 'image' && asset.placement === 'lesson',
  );
  const visualAltTextApproved = activeLessonImages.every(
    (asset) => typeof asset.alt_text === 'string' && asset.alt_text.trim().length > 0,
  );
  // Interactive lesson controls use native buttons/inputs and the canonical
  // player keyboard contract. Persisted evidence here verifies content-specific
  // caption/transcript and alt-text requirements; UI keyboard support remains a
  // tested platform invariant.
  const accessibilityApproved =
    mediaEvidenceApproved && lessonAccessibilityApproved && visualAltTextApproved;
  const accessibilityFindings = [
    ...(!mediaEvidenceApproved ? ['Canonical media quality evidence is incomplete.'] : []),
    ...(!lessonAccessibilityApproved ? ['One or more lessons are missing captions or transcript evidence.'] : []),
    ...(!visualAltTextApproved ? ['One or more active lesson images are missing alt text.'] : []),
  ];
  const accessibility = accessibilityApproved
    ? {
        approved: true,
        checkedAt: new Date().toISOString(),
        findings: [],
      }
    : accessibilityFindings.length
      ? {
          approved: false,
          checkedAt: new Date().toISOString(),
          findings: accessibilityFindings,
        }
      : null;

  const learnerPreview =
    course?.review_status === 'approved' && course.reviewed_at && course.reviewed_by
      ? {
          approved: true,
          checkedAt: course.reviewed_at,
          reviewerId: course.reviewed_by,
          version: Math.max(1, Number(course.version ?? 1)),
        }
      : null;

  const mediaByLesson = new Map<string, {
    source: 'envato' | 'owned';
    licenseStatus: 'verified_paid' | 'owned';
    licenseEvidenceUrl?: string;
    matchScore: number;
  }>();
  for (const job of lessonJobs) {
    if (
      job.status !== 'complete' ||
      job.review_status !== 'approved' ||
      !hasCanonicalMediaQualityEvidence(job.quality_evidence)
    ) continue;
    const quality = job.quality_evidence as {
      visualEvidenceCoverage?: number;
      sourceEvidenceCoverage?: number;
      sourceProviders?: string[];
      licenseEvidenceUrls?: string[];
    };
    const providers = Array.isArray(quality.sourceProviders) ? quality.sourceProviders : [];
    const licenseUrls = Array.isArray(quality.licenseEvidenceUrls)
      ? quality.licenseEvidenceUrls.filter(Boolean)
      : [];
    const envatoLicensed = providers.some((provider) => provider.toLowerCase() === 'envato');
    mediaByLesson.set(job.lesson_id, {
      source: envatoLicensed ? 'envato' : 'owned',
      licenseStatus: envatoLicensed ? 'verified_paid' : 'owned',
      ...(licenseUrls[0]
        ? { licenseEvidenceUrl: licenseUrls[0] }
        : typeof job.video_url === 'string' && job.video_url
          ? { licenseEvidenceUrl: job.video_url }
          : {}),
      matchScore: Math.min(
        1,
        Math.max(
          0,
          Number(quality.visualEvidenceCoverage ?? 0),
          Number(quality.sourceEvidenceCoverage ?? 0),
        ),
      ),
    });
  }

  return { accessibility, learnerPreview, mediaByLesson };
}
