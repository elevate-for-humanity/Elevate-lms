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

const assessed = new Set(['quiz', 'checkpoint', 'exam']);
const practical = new Set(['practical', 'lab', 'fieldwork', 'observation']);

function hasSubstantiveContent(lesson: BuilderLesson): boolean {
  if (lesson.renderedHtml?.trim()) return true;
  if (lesson.videoUrl?.trim()) return true;
  if (lesson.content && Object.keys(lesson.content).length > 0) return true;
  return false;
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
      if (!hasSubstantiveContent(lesson) && !assessed.has(lesson.lessonType)) {
        add('error', 'LESSON_CONTENT_EMPTY', path, 'Instructional lesson has no substantive content, rendered material, or video.');
      }
      if (!lesson.learningObjectives?.length) {
        add('error', 'OBJECTIVES_REQUIRED', `${path}.learningObjectives`, 'Every lesson must have measurable learning objectives.');
      }
      if (!lesson.domainKey?.trim()) {
        add('error', 'DOMAIN_MAPPING_REQUIRED', `${path}.domainKey`, 'Every lesson must map to a standards/competency domain.');
      }
      if (!lesson.deliveryMethod) {
        add('error', 'DELIVERY_METHOD_REQUIRED', `${path}.deliveryMethod`, 'Delivery method must be explicit for auditability.');
      }
      if (!lesson.hourCategory) {
        add('error', 'HOUR_CATEGORY_REQUIRED', `${path}.hourCategory`, 'Instructional hours must be categorized.');
      }

      if (assessed.has(lesson.lessonType)) {
        if (!lesson.quizQuestions?.length) {
          add('error', 'QUESTIONS_REQUIRED', `${path}.quizQuestions`, 'Assessment has no questions.');
        }
        if (lesson.passingScore == null) {
          add('error', 'PASSING_SCORE_REQUIRED', `${path}.passingScore`, 'Assessment must define a passing/mastery threshold.');
        }
        for (const [qi, question] of (lesson.quizQuestions ?? []).entries()) {
          if (!question.explanation?.trim()) {
            add('error', 'RATIONALE_REQUIRED', `${path}.quizQuestions[${qi}].explanation`, 'Every scored question must provide a rationale for self-paced remediation.');
          }
          if (!question.competencyKeys?.length && !question.domainKey) {
            add('error', 'QUESTION_MAPPING_REQUIRED', `${path}.quizQuestions[${qi}]`, 'Every question must map to a competency or standards domain.');
          }
        }
      }

      if (lesson.practicalRequired || practical.has(lesson.lessonType)) {
        if (!lesson.competencyChecks?.length) {
          add('error', 'PRACTICAL_COMPETENCY_REQUIRED', `${path}.competencyChecks`, 'Practical work must identify observable competencies.');
        }
        if (!lesson.evidenceType) {
          add('error', 'PRACTICAL_EVIDENCE_REQUIRED', `${path}.evidenceType`, 'Practical work must specify acceptable evidence.');
        }
        if (!lesson.requiresInstructorSignoff) {
          add('error', 'PRACTICAL_SIGNOFF_REQUIRED', `${path}.requiresInstructorSignoff`, 'Hands-on competency must require authorized human sign-off.');
        }
      }

      if (lesson.aiGenerated && lesson.approved !== true) {
        add('error', 'AI_REVIEW_REQUIRED', `${path}.approved`, 'AI-generated lessons require human approval before publication.');
      }

      if (template.status === 'published' && lesson.generationStatus && lesson.generationStatus !== 'published') {
        add('error', 'STATE_CONTRADICTION', `${path}.generationStatus`, 'Published course contains a lesson that is not in published generation state.');
      }
    }
  }

  if (template.requiresFinalExam) {
    if (!template.finalExam?.required) add('error', 'FINAL_EXAM_CONFIG_REQUIRED', 'finalExam.required', 'Final exam configuration must be enabled.');
    if (!template.finalExam?.passingScore) add('error', 'FINAL_EXAM_PASSING_SCORE_REQUIRED', 'finalExam.passingScore', 'Final exam requires a passing score.');
    if (!template.finalExam?.questionCount || template.finalExam.questionCount < 10) {
      add('error', 'FINAL_EXAM_DEPTH_REQUIRED', 'finalExam.questionCount', 'Final readiness exam must define a meaningful question count.');
    }
  }

  if (competencyKeys.size === 0) {
    add('error', 'COMPETENCY_GRAPH_REQUIRED', 'modules[].lessons[].competencyChecks', 'Course must expose competency-level mastery mappings.');
  }

  if (!template.certificateRequirements?.includeCompletionDate) {
    add('error', 'COMPLETION_EVIDENCE_REQUIRED', 'certificateRequirements.includeCompletionDate', 'Completion evidence must include completion date.');
  }
  if (!template.certificateRequirements?.includeVerificationUrl) {
    add('error', 'CERTIFICATE_VERIFICATION_REQUIRED', 'certificateRequirements.includeVerificationUrl', 'Government/enterprise completion records must be independently verifiable.');
  }

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
      publishedLessons: lessons.filter((l) => l.generationStatus === 'published').length,
    },
  };
}
