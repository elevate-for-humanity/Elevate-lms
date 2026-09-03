import type { ProgramBuilderTemplate, BuilderLesson } from '@/lib/course-builder/schema';

export type ProcurementIssue = {
  severity: 'error' | 'warning';
  code: string;
  path: string;
  message: string;
};

export type ProcurementGateResult = {
  ok: boolean;
  issues: ProcurementIssue[];
  metrics: {
    modules: number;
    lessons: number;
    assessments: number;
    practicals: number;
    competencies: number;
    approvedLessons: number;
    publishedLessons: number;
  };
};

const assessed = new Set(['quiz', 'checkpoint', 'exam', 'final_exam']);
const practical = new Set(['practical', 'lab', 'fieldwork', 'observation', 'practicum']);

function hasSubstantiveContent(lesson: BuilderLesson): boolean {
  if (lesson.renderedHtml?.trim()) return true;
  if (lesson.videoUrl?.trim()) return true;
  if (lesson.content && Object.keys(lesson.content).length > 0) return true;
  return false;
}

function experienceFor(lesson: BuilderLesson): Record<string, any> | null {
  const content = lesson.content as Record<string, any> | undefined;
  if (!content || typeof content !== 'object') return null;
  const experience = content.experience;
  return experience && typeof experience === 'object' ? experience as Record<string, any> : null;
}

function requireExperienceAssets(
  experience: Record<string, any>,
  path: string,
  add: (severity: 'error' | 'warning', code: string, path: string, message: string) => void,
) {
  if (!experience.readingGuide || !Array.isArray(experience.readingGuide.sections) || experience.readingGuide.sections.length < 3) {
    add('error', 'READING_GUIDE_REQUIRED', `${path}.content.experience.readingGuide`, 'Self-paced instruction requires a complete reading/eBook-equivalent layer.');
  }
  if (!String(experience.narrationScript ?? '').trim()) {
    add('error', 'NARRATION_REQUIRED', `${path}.content.experience.narrationScript`, 'Self-paced lesson requires narration/transcript content.');
  }
  if (!String(experience.visualPrompt ?? '').trim()) {
    add('error', 'VISUAL_SPEC_REQUIRED', `${path}.content.experience.visualPrompt`, 'Self-paced lesson requires an accessible visual specification.');
  }
  if (!Array.isArray(experience.flashcards) || experience.flashcards.length < 6) {
    add('error', 'FLASHCARDS_REQUIRED', `${path}.content.experience.flashcards`, 'Self-paced lesson requires at least six review flashcards.');
  }
  if (!Array.isArray(experience.quickClips) || experience.quickClips.length < 2) {
    add('error', 'MICROVIDEO_REQUIRED', `${path}.content.experience.quickClips`, 'Self-paced lesson requires at least two short concept-clip specifications.');
  }
  if (!Array.isArray(experience.knowledgeChecks) || experience.knowledgeChecks.length < 3) {
    add('error', 'KNOWLEDGE_CHECKS_REQUIRED', `${path}.content.experience.knowledgeChecks`, 'Self-paced lesson requires at least three formative knowledge checks.');
  }
  if (!Array.isArray(experience.exercises) || experience.exercises.length < 1) {
    add('error', 'LEARN_BY_DOING_REQUIRED', `${path}.content.experience.exercises`, 'Every instructional lesson requires at least one learn-by-doing exercise.');
  }
  if (!Array.isArray(experience.resources) || experience.resources.length < 2) {
    add('error', 'LEARNER_RESOURCES_REQUIRED', `${path}.content.experience.resources`, 'Every instructional lesson requires at least two reusable learner resources.');
  }
  if (!Array.isArray(experience.glossary) || experience.glossary.length < 4) {
    add('error', 'GLOSSARY_REQUIRED', `${path}.content.experience.glossary`, 'Every instructional lesson requires at least four lesson-specific glossary terms.');
  }
  if (!experience.remediation || Number(experience.remediation.passingScore ?? 0) <= 0 || !Array.isArray(experience.remediation.targetedActions)) {
    add('error', 'REMEDIATION_REQUIRED', `${path}.content.experience.remediation`, 'Self-paced lesson requires mastery-based targeted remediation.');
  }
  if (!experience.readiness || !String(experience.readiness.domainKey ?? '').trim() || !Array.isArray(experience.readiness.evidenceSignals)) {
    add('error', 'READINESS_ANALYTICS_REQUIRED', `${path}.content.experience.readiness`, 'Self-paced lesson requires domain-level readiness evidence for learner analytics.');
  }
  if (!experience.scenario || !experience.caseStudy || !experience.practicalTask) {
    add('error', 'APPLIED_CONTEXT_REQUIRED', `${path}.content.experience`, 'Self-paced lesson requires scenario, case study, and practical application.');
  }
}

export function runGovernmentProcurementGate(template: ProgramBuilderTemplate): ProcurementGateResult {
  const issues: ProcurementIssue[] = [];
  const add = (severity: 'error' | 'warning', code: string, path: string, message: string) =>
    issues.push({ severity, code, path, message });

  const modules = template.modules ?? [];
  const lessons = modules.flatMap((m) => m.lessons ?? []);
  const assessmentLessons = lessons.filter((l) => assessed.has(l.lessonType));
  const practicalLessons = lessons.filter((l) => l.practicalRequired || practical.has(l.lessonType));
  const competencyKeys = new Set(
    lessons.flatMap((l) => (l.competencyChecks ?? []).map((c) => c.key).filter(Boolean)),
  );

  if (template.credentialTarget !== 'INTERNAL') {
    if (!template.regulatory?.governingBody?.trim()) {
      add('error', 'GOVERNING_BODY_REQUIRED', 'regulatory.governingBody', 'External/regulated courses must identify the governing or credentialing body.');
    }
    if (!template.regulatory?.governingStandardVersion?.trim()) {
      add('error', 'STANDARD_VERSION_REQUIRED', 'regulatory.governingStandardVersion', 'External/regulated courses must identify the governing standard/test-plan version.');
    }
  }

  if (!modules.length) add('error', 'MODULES_REQUIRED', 'modules', 'A procurement-ready course must contain modules.');
  if (!lessons.length) add('error', 'LESSONS_REQUIRED', 'modules[].lessons', 'A procurement-ready course must contain lessons.');
  if (!assessmentLessons.length) add('error', 'ASSESSMENT_SYSTEM_REQUIRED', 'modules[].lessons', 'A self-paced course must include objective assessments.');

  for (const [mi, module] of modules.entries()) {
    const moduleAssessments = (module.lessons ?? []).filter((l) => assessed.has(l.lessonType));
    if (module.quizRequired && moduleAssessments.length === 0) {
      add('error', 'MODULE_ASSESSMENT_MISSING', `modules[${mi}]`, 'Module requires assessment but none is present.');
    }

    for (const [li, lesson] of (module.lessons ?? []).entries()) {
      const path = `modules[${mi}].lessons[${li}]`;
      const isAssessment = assessed.has(lesson.lessonType);
      const isPractical = Boolean(lesson.practicalRequired) || practical.has(lesson.lessonType);
      const experience = experienceFor(lesson);

      if (!hasSubstantiveContent(lesson) && !isAssessment) {
        add('error', 'LESSON_CONTENT_EMPTY', path, 'Instructional lesson has no substantive content, rendered material, or video.');
      }
      if (!lesson.learningObjectives?.length) add('error', 'OBJECTIVES_REQUIRED', `${path}.learningObjectives`, 'Every lesson must have measurable learning objectives.');
      if (!lesson.domainKey?.trim()) add('error', 'DOMAIN_MAPPING_REQUIRED', `${path}.domainKey`, 'Every lesson must map to a standards/competency domain.');
      if (!lesson.deliveryMethod) add('error', 'DELIVERY_METHOD_REQUIRED', `${path}.deliveryMethod`, 'Delivery method must be explicit for auditability.');
      if (!lesson.hourCategory) add('error', 'HOUR_CATEGORY_REQUIRED', `${path}.hourCategory`, 'Instructional hours must be categorized.');

      if (!isAssessment && lesson.aiGenerated) {
        if (!experience) {
          add('error', 'SELF_PACED_EXPERIENCE_REQUIRED', `${path}.content.experience`, 'AI-generated self-paced instruction must include the canonical commercial learning experience.');
        } else {
          requireExperienceAssets(experience, path, add);
        }
      }

      if (isAssessment) {
        if (!lesson.quizQuestions?.length) add('error', 'QUESTIONS_REQUIRED', `${path}.quizQuestions`, 'Assessment has no questions.');
        if (lesson.passingScore == null) add('error', 'PASSING_SCORE_REQUIRED', `${path}.passingScore`, 'Assessment must define a passing/mastery threshold.');
        for (const [qi, question] of (lesson.quizQuestions ?? []).entries()) {
          if (!question.explanation?.trim()) add('error', 'RATIONALE_REQUIRED', `${path}.quizQuestions[${qi}].explanation`, 'Every scored question must provide a rationale for self-paced remediation.');
          if (!question.competencyKeys?.length && !question.domainKey) add('error', 'QUESTION_MAPPING_REQUIRED', `${path}.quizQuestions[${qi}]`, 'Every question must map to a competency or standards domain.');
        }
      }

      if (isPractical) {
        if (!lesson.competencyChecks?.length) add('error', 'PRACTICAL_COMPETENCY_REQUIRED', `${path}.competencyChecks`, 'Practical work must identify observable competencies.');
        if (!lesson.evidenceType) add('error', 'PRACTICAL_EVIDENCE_REQUIRED', `${path}.evidenceType`, 'Practical work must specify acceptable evidence.');
        if (!lesson.requiresInstructorSignoff) add('error', 'PRACTICAL_SIGNOFF_REQUIRED', `${path}.requiresInstructorSignoff`, 'Hands-on competency must require authorized human sign-off.');
      }

      if (template.status === 'published' && lesson.generationStatus && !['published', 'completed'].includes(lesson.generationStatus)) {
        add('error', 'STATE_CONTRADICTION', `${path}.generationStatus`, 'Published course contains a lesson that is not in a completed/published generation state.');
      }
    }
  }

  if (template.requiresFinalExam) {
    if (!template.finalExam?.required) add('error', 'FINAL_EXAM_CONFIG_REQUIRED', 'finalExam.required', 'Final exam configuration must be enabled.');
    if (!template.finalExam?.passingScore) add('error', 'FINAL_EXAM_PASSING_SCORE_REQUIRED', 'finalExam.passingScore', 'Final exam requires a passing score.');
    if (!template.finalExam?.questionCount || template.finalExam.questionCount < 25) add('error', 'FINAL_EXAM_DEPTH_REQUIRED', 'finalExam.questionCount', 'Final readiness exam must contain at least 25 questions.');
  }

  if (competencyKeys.size === 0) add('error', 'COMPETENCY_GRAPH_REQUIRED', 'modules[].lessons[].competencyChecks', 'Course must expose competency-level mastery mappings.');
  if (!template.certificateRequirements?.includeCompletionDate) add('error', 'COMPLETION_EVIDENCE_REQUIRED', 'certificateRequirements.includeCompletionDate', 'Completion evidence must include completion date.');
  if (!template.certificateRequirements?.includeVerificationUrl) add('error', 'CERTIFICATE_VERIFICATION_REQUIRED', 'certificateRequirements.includeVerificationUrl', 'Government/enterprise completion records must be independently verifiable.');

  return {
    ok: !issues.some((i) => i.severity === 'error'),
    issues,
    metrics: {
      modules: modules.length,
      lessons: lessons.length,
      assessments: assessmentLessons.length,
      practicals: practicalLessons.length,
      competencies: competencyKeys.size,
      approvedLessons: lessons.filter((l) => l.approved === true).length,
      publishedLessons: lessons.filter((l) => ['published', 'completed'].includes(l.generationStatus ?? '')).length,
    },
  };
}
