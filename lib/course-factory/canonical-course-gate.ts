import { loadCourseSession } from '@/lib/studio/course-session';
import {
  coursePackageFromSession,
  loadPersistedCoursePackageEvidence,
} from '@/lib/course-package/from-course-session';
import { CanonicalCredentialLessonSchema } from './canonical-credential-course-contract';
import {
  evaluateCourseReadiness,
  REQUIRED_COURSE_GATES,
  type CourseGate,
} from '@/lib/course-package/readiness';

export type CanonicalGateFinding = {
  gate: CourseGate | 'identity';
  lessonId?: string;
  path?: string;
  pass?: boolean;
  message: string;
};

function lessonIdFromPath(
  path: string,
  lessonIdsBySlug: Map<string, string>,
): string | undefined {
  const prefix = 'modules.lessons.';
  if (!path.startsWith(prefix)) return undefined;
  const remainder = path.slice(prefix.length);
  const slug = remainder.split('.')[0];
  return lessonIdsBySlug.get(slug);
}


function record(value: unknown): Record<string, any> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
}

function gateForCredentialLessonPath(path: PropertyKey[]): CourseGate {
  const key = path.join('.');
  if (/domainKey|competencyKeys|intelligence/.test(key)) return 'credential_alignment';
  if (/objectives/.test(key)) return 'learning_objectives';
  if (/media\.storyboard|minimumStoryboardScenes/.test(key)) return 'storyboard';
  if (/media\.captions/.test(key)) return 'captions';
  if (/media\.transcript/.test(key)) return 'transcript';
  if (/professionalNarration|narrationProvider|noLoopingNarration/.test(key)) return 'narration';
  if (/visual|provenance|noRepeatedFillerVisuals|noBackwardTimelineJumps/.test(key))
    return 'visual_alignment';
  if (/qualityApproval|primaryVideoJob|createdWithLesson|learnerPlayback/.test(key))
    return 'demonstration';
  if (/knowledgeChecks|remediation/.test(key)) return 'knowledge_checks';
  if (/scenario|caseStudy|exercises|practicalTask/.test(key)) return 'interactive_practice';
  if (/progressTracking/.test(key)) return 'progress_tracking';
  if (/resumeTracking/.test(key)) return 'resume_tracking';
  return 'instructional_content';
}

function strictCredentialLessonFindings(
  lesson: Awaited<ReturnType<typeof loadCourseSession>>['lessons'][number],
): CanonicalGateFinding[] {
  const contentJson = record(lesson.content_json);
  const experience = record(contentJson.experience);
  const intelligence = record(experience.intelligence);
  const videoConfig = record(lesson.video_config);
  const sceneData = record(lesson.scene_data);
  const quality = record(lesson.media_quality_evidence);
  const instructional = record(quality.instructionalQuality);
  const competencyKeys = [
    ...(Array.isArray(lesson.competency_checks)
      ? lesson.competency_checks.flatMap((value) => {
          const item = record(value);
          const key = String(item.id ?? item.competencyKey ?? item.key ?? '').trim();
          return key ? [key] : [];
        })
      : []),
    ...(Array.isArray(intelligence.skills)
      ? intelligence.skills.flatMap((value: unknown) => {
          const item = record(value);
          const key = String(item.key ?? item.id ?? '').trim();
          return key ? [key] : [];
        })
      : []),
  ];
  const scenes = Array.isArray(sceneData.scenes) ? sceneData.scenes : [];
  const timeline = record(experience.instructionalTimeline);
  const qualityApproved =
    lesson.video_status === 'complete' &&
    lesson.media_quality_status === 'approved' &&
    Boolean(lesson.video_url);
  const sourceCoverage = Number(quality.sourceEvidenceCoverage ?? 0);
  const exactCoverage = Number(quality.exactVisualSourceCoverage ?? 0);
  const providerClass = String(quality.narrationProviderClass ?? '');
  const parsed = CanonicalCredentialLessonSchema.safeParse({
    slug: lesson.slug,
    title: lesson.title,
    domainKey: lesson.domain_key ?? '',
    objectives: Array.isArray(lesson.learning_objectives)
      ? lesson.learning_objectives.map(String).filter(Boolean)
      : [],
    competencyKeys: [...new Set(competencyKeys)],
    experience,
    intelligence,
    media: {
      createdWithLessonRequired: Boolean(lesson.video_job_id),
      primaryVideoJobRequired: Boolean(lesson.video_job_id),
      sourceFingerprintRequired: Boolean(videoConfig.source_fingerprint),
      storyboardRequired: scenes.length >= 6,
      minimumStoryboardScenes: scenes.length >= 6 ? 6 : 0,
      licensedWorkspaceRequired: qualityApproved && exactCoverage >= 1,
      provenanceRequired: qualityApproved && sourceCoverage >= 1,
      professionalNarrationRequired: qualityApproved && providerClass === 'professional',
      narrationProviderEvidenceRequired:
        qualityApproved && Boolean(quality.provider) && Boolean(quality.providerModel),
      captionsRequired:
        qualityApproved && Boolean(quality.captionUrl ?? sceneData.captionUrl ?? timeline.captions),
      transcriptRequired:
        qualityApproved && Boolean(quality.transcriptUrl ?? sceneData.transcriptUrl ?? experience.narrationScript),
      noLoopingNarration:
        qualityApproved && Number(instructional.repeatedNarrationSegments ?? 1) === 0,
      noRepeatedFillerVisuals:
        qualityApproved && Number(quality.repeatedVisualMaximum ?? 99) <= 3,
      noBackwardTimelineJumps:
        qualityApproved && quality.backwardTimelineJumpDetected === false,
      narrationVisualAlignmentRequired:
        qualityApproved && Number(instructional.sceneNarrationAlignment ?? 0) >= 0.75,
      qualityApprovalRequired: qualityApproved,
      learnerPlaybackVerificationRequired: qualityApproved,
    },
    learnerExperience: {
      demonstrationRequired: scenes.length >= 6,
      exerciseRequired: Array.isArray(experience.exercises) && experience.exercises.length > 0,
      scenarioRequired: Boolean(experience.scenario),
      caseStudyRequired: Boolean(experience.caseStudy),
      practicalRequired: Boolean(experience.practicalTask),
      knowledgeChecksRequired:
        Array.isArray(experience.knowledgeChecks) && experience.knowledgeChecks.length >= 3,
      remediationRequired: Boolean(experience.remediation),
      progressTrackingRequired:
        Boolean(timeline.durationSeconds) && Number(timeline.requiredWatchPercent ?? 0) > 0,
      resumeTrackingRequired: timeline.resumeEnabled === true,
      mediaCompletionRequiredForLessonCompletion: qualityApproved,
    },
  });
  if (parsed.success) return [];
  return parsed.error.issues.map((issue) => ({
    gate: gateForCredentialLessonPath(issue.path),
    lessonId: lesson.id,
    path: `modules.lessons.${lesson.slug}.${issue.path.join('.')}`,
    pass: false,
    message: `Credential lesson contract: ${issue.message}`,
  }));
}

/**
 * Single persisted-course authority for Course Builder repair and publication.
 *
 * Persisted Studio data is adapted into the same CoursePackage contract used by
 * export/publication. This prevents the repair loop from declaring success
 * against a smaller validator than the production package actually requires.
 */
export async function evaluatePersistedCredentialCourse(courseId: string) {
  const session = await loadCourseSession(courseId, { system: true });

  if (!session.course.program_id) {
    return {
      pass: false,
      gates: Object.fromEntries(
        REQUIRED_COURSE_GATES.map((gate) => [gate, false]),
      ) as Record<CourseGate, boolean>,
      findings: [
        {
          gate: 'identity' as const,
          message: 'Program ownership is missing.',
        },
      ],
    };
  }

  let coursePackage;
  try {
    const evidence = await loadPersistedCoursePackageEvidence(courseId);
    coursePackage = coursePackageFromSession(session, evidence);
  } catch (error) {
    return {
      pass: false,
      gates: Object.fromEntries(
        REQUIRED_COURSE_GATES.map((gate) => [gate, false]),
      ) as Record<CourseGate, boolean>,
      findings: [
        {
          gate: 'instructional_content' as const,
          message:
            error instanceof Error
              ? `Course package contract is invalid: ${error.message}`
              : 'Course package contract is invalid.',
        },
      ],
    };
  }

  const readiness = evaluateCourseReadiness(coursePackage);
  const lessonIdsBySlug = new Map(
    session.lessons.map((lesson) => [lesson.slug, lesson.id]),
  );
  const findings: CanonicalGateFinding[] = readiness.findings.map((finding) => ({
    gate: finding.gate,
    path: finding.path,
    lessonId: lessonIdFromPath(finding.path, lessonIdsBySlug),
    pass: false,
    message: finding.message,
  }));

  const strictFindings = session.lessons
    .filter((lesson) => lesson.is_required)
    .flatMap((lesson) => strictCredentialLessonFindings(lesson));
  findings.push(...strictFindings);
  const gates = { ...readiness.gates };
  for (const finding of strictFindings) gates[finding.gate] = false;

  return {
    pass: readiness.pass && strictFindings.length === 0,
    gates,
    findings,
  };
}
