/**
 * lib/course-builder/audit.ts
 * Regulatory hard gate. Nothing publishes unless this passes.
 */

import type {
  ProgramBuilderTemplate,
  BuilderLesson,
  BuilderModule,
  ComplianceDomainRequirement,
} from './schema';
import { getComplianceProfile } from './compliance-profiles';

export interface AuditIssue {
  severity: 'error' | 'warning';
  path: string;
  message: string;
  code?: string;
}

export interface AuditStats {
  moduleCount: number;
  lessonCount: number;
  totalMinutes: number;
  totalHours: number;
  quizLessons: number;
  practicalLessons: number;
  checkpointLessons: number;
  examLessons: number;
  fieldworkLessons: number;
  observationLessons: number;
  domainHours: Record<string, number>;
  competencyCount: number;
}

export interface AuditResult {
  ok: boolean;
  issues: AuditIssue[];
  stats: AuditStats;
  profileKey: string;
  profileLabel: string;
}

function err(issues: AuditIssue[], path: string, message: string, code?: string) {
  issues.push({ severity: 'error', path, message, code });
}

function warn(issues: AuditIssue[], path: string, message: string, code?: string) {
  issues.push({ severity: 'warning', path, message, code });
}

function isAssessment(type: string) {
  return type === 'quiz' || type === 'checkpoint' || type === 'exam';
}

function validateLessonCore(
  lesson: BuilderLesson,
  module: BuilderModule,
  issues: AuditIssue[],
  mi: number,
  li: number,
) {
  const p = `modules[${mi}].lessons[${li}]`;
  if (!lesson.title?.trim())   err(issues, `${p}.title`,         'Lesson title is required',                    'LESSON_TITLE_REQUIRED');
  if (!lesson.slug?.trim())    err(issues, `${p}.slug`,          'Lesson slug is required',                     'LESSON_SLUG_REQUIRED');
  if (!lesson.lessonType)      err(issues, `${p}.lessonType`,    'Lesson type is required',                     'LESSON_TYPE_REQUIRED');
  if (!Number.isFinite(lesson.orderIndex))
                               err(issues, `${p}.orderIndex`,    'Lesson orderIndex is required',               'LESSON_ORDER_REQUIRED');
  if (!Number.isFinite(lesson.durationMinutes) || lesson.durationMinutes <= 0)
                               err(issues, `${p}.durationMinutes`, 'durationMinutes must be > 0',              'LESSON_DURATION_REQUIRED');
  if (!Array.isArray(lesson.learningObjectives) || lesson.learningObjectives.length === 0)
                               err(issues, `${p}.learningObjectives`, 'At least one learning objective required', 'LEARNING_OBJECTIVES_REQUIRED');

  if (isAssessment(lesson.lessonType)) {
    if (!Array.isArray(lesson.quizQuestions) || lesson.quizQuestions.length === 0)
      err(issues, `${p}.quizQuestions`, 'Assessment lesson must have quiz questions', 'ASSESSMENT_QUESTIONS_REQUIRED');
  }

  if (lesson.practicalRequired || lesson.lessonType === 'practical') {
    if (!Array.isArray(lesson.competencyChecks) || lesson.competencyChecks.length === 0)
      err(issues, `${p}.competencyChecks`, 'Practical lesson must have at least one competency check', 'PRACTICAL_COMPETENCY_REQUIRED');
  }
}

function validateLessonCompliance(
  lesson: BuilderLesson,
  issues: AuditIssue[],
  mi: number,
  li: number,
  profile: ReturnType<typeof getComplianceProfile>,
) {
  const p = `modules[${mi}].lessons[${li}]`;

  if (profile.requirePassingScoresForAssessments && isAssessment(lesson.lessonType)) {
    if (lesson.passingScore == null)
      err(issues, `${p}.passingScore`, 'Assessment lesson must have passingScore', 'PASSING_SCORE_REQUIRED');
  }

  if (profile.requireDomainMapping && !lesson.domainKey?.trim())
    err(issues, `${p}.domainKey`, 'Lesson domainKey is required', 'DOMAIN_KEY_REQUIRED');

  if (profile.requireHourCategory && !lesson.hourCategory)
    err(issues, `${p}.hourCategory`, 'Lesson hourCategory is required', 'HOUR_CATEGORY_REQUIRED');

  if (profile.requireDeliveryMethod && !lesson.deliveryMethod)
    err(issues, `${p}.deliveryMethod`, 'Lesson deliveryMethod is required', 'DELIVERY_METHOD_REQUIRED');

  if (profile.requireCompetencyMapping &&
      (lesson.practicalRequired || lesson.lessonType === 'practical' ||
       lesson.lessonType === 'observation' || lesson.lessonType === 'fieldwork')) {
    if (!Array.isArray(lesson.competencyChecks) || lesson.competencyChecks.length === 0)
      err(issues, `${p}.competencyChecks`, 'Competency mapping is required', 'COMPETENCY_MAPPING_REQUIRED');
  }

  if (profile.requireEvidenceForPracticals &&
      (lesson.practicalRequired || lesson.lessonType === 'practical')) {
    if (!lesson.evidenceType)
      err(issues, `${p}.evidenceType`, 'Practical lesson must define evidenceType', 'EVIDENCE_TYPE_REQUIRED');
  }

  if (profile.requireInstructorSignoffForPracticals &&
      (lesson.practicalRequired || lesson.lessonType === 'practical')) {
    const hasSignoff =
      lesson.requiresInstructorSignoff ||
      (lesson.competencyChecks ?? []).some(c => c.requiresInstructorSignoff);
    if (!hasSignoff)
      err(issues, `${p}.requiresInstructorSignoff`, 'Practical lesson must require instructor signoff', 'INSTRUCTOR_SIGNOFF_REQUIRED');
  }

  if (profile.requireInstructorRequirements &&
      (lesson.requiresInstructorSignoff || lesson.practicalRequired || lesson.lessonType === 'practical')) {
    if (!lesson.instructorRequirement?.required)
      err(issues, `${p}.instructorRequirement`, 'Instructor requirement must be configured', 'INSTRUCTOR_REQUIREMENT_REQUIRED');
  }

  if (profile.requireArtifactRules &&
      (lesson.practicalRequired || lesson.lessonType === 'assignment' || lesson.lessonType === 'fieldwork')) {
    if (!Array.isArray(lesson.requiredArtifacts) || lesson.requiredArtifacts.length === 0)
      warn(issues, `${p}.requiredArtifacts`, 'Lesson should define requiredArtifacts', 'ARTIFACT_RULES_RECOMMENDED');
  }
}

function validateRequiredDomains(
  requiredDomains: ComplianceDomainRequirement[],
  domainHours: Record<string, number>,
  issues: AuditIssue[],
) {
  for (const domain of requiredDomains) {
    if (domain.required && !domainHours[domain.key])
      err(issues, `regulatory.requiredDomains.${domain.key}`,
        `Required domain "${domain.label}" has no mapped lesson hours`, 'REQUIRED_DOMAIN_MISSING');

    if (domain.minimumHours != null) {
      const actual = domainHours[domain.key] ?? 0;
      if (actual < domain.minimumHours)
        err(issues, `regulatory.requiredDomains.${domain.key}`,
          `Domain "${domain.label}" has ${actual.toFixed(2)}h but requires ${domain.minimumHours}h`, 'DOMAIN_HOURS_BELOW_MINIMUM');
    }
  }
}

export function auditCourseTemplate(template: ProgramBuilderTemplate): AuditResult {
  const issues: AuditIssue[] = [];
  const profile = getComplianceProfile(template.regulatory?.complianceProfileKey ?? 'internal_basic');

  if (!template.title?.trim())  err(issues, 'title',  'Program title is required',  'PROGRAM_TITLE_REQUIRED');
  if (!template.slug?.trim())   err(issues, 'slug',   'Program slug is required',   'PROGRAM_SLUG_REQUIRED');
  if (!template.credentialTarget) err(issues, 'credentialTarget', 'Credential target is required', 'CREDENTIAL_TARGET_REQUIRED');

  if (!Number.isFinite(template.minimumHours) || template.minimumHours <= 0)
    err(issues, 'minimumHours', 'minimumHours must be > 0', 'MINIMUM_HOURS_REQUIRED');

  if (!Array.isArray(template.modules) || template.modules.length === 0)
    err(issues, 'modules', 'At least one module is required', 'MODULES_REQUIRED');

  if (template.minimumHours < profile.minimumProgramHours)
    err(issues, 'minimumHours',
      `minimumHours (${template.minimumHours}) is below profile minimum (${profile.minimumProgramHours})`,
      'PROFILE_MINIMUM_HOURS_NOT_MET');

  if (profile.requireRetentionPolicy && !template.regulatory?.retentionPolicyDays)
    err(issues, 'regulatory.retentionPolicyDays', 'Retention policy days are required', 'RETENTION_POLICY_REQUIRED');

  if (profile.requireCertificateVerification && !template.certificateRequirements?.includeVerificationUrl)
    err(issues, 'certificateRequirements.includeVerificationUrl',
      'Certificate verification URL is required for this profile', 'CERTIFICATE_VERIFICATION_REQUIRED');

  if (profile.requiresFinalExam || template.requiresFinalExam) {
    if (!template.requiresFinalExam)
      err(issues, 'requiresFinalExam', 'Program must require a final exam under this profile', 'FINAL_EXAM_REQUIRED');
    if (!template.finalExam?.required)
      err(issues, 'finalExam.required', 'finalExam.required must be true', 'FINAL_EXAM_CONFIG_REQUIRED');
    if (!template.finalExam?.passingScore)
      err(issues, 'finalExam.passingScore', 'Final exam passingScore is required', 'FINAL_EXAM_PASSING_SCORE_REQUIRED');
  }

  let totalMinutes = 0;
  let quizLessons = 0, practicalLessons = 0, checkpointLessons = 0;
  let examLessons = 0, fieldworkLessons = 0, observationLessons = 0;
  let competencyCount = 0;
  const domainHours: Record<string, number> = {};
  const seenModuleOrder = new Set<number>();

  for (const [mi, module] of (template.modules ?? []).entries()) {
    const mp = `modules[${mi}]`;

    if (!module.title?.trim()) err(issues, `${mp}.title`, 'Module title is required', 'MODULE_TITLE_REQUIRED');
    if (!module.slug?.trim())  err(issues, `${mp}.slug`,  'Module slug is required',  'MODULE_SLUG_REQUIRED');

    if (!Number.isFinite(module.orderIndex)) {
      err(issues, `${mp}.orderIndex`, 'Module orderIndex is required', 'MODULE_ORDER_REQUIRED');
    } else if (seenModuleOrder.has(module.orderIndex)) {
      err(issues, `${mp}.orderIndex`, 'Duplicate module orderIndex', 'MODULE_ORDER_DUPLICATE');
    } else {
      seenModuleOrder.add(module.orderIndex);
    }

    if (profile.requireDomainMapping && !module.domainKey?.trim())
      err(issues, `${mp}.domainKey`, 'Module domainKey is required', 'MODULE_DOMAIN_REQUIRED');

    if (!Number.isFinite(module.targetHours) || module.targetHours <= 0)
      err(issues, `${mp}.targetHours`, 'Module targetHours must be > 0', 'MODULE_TARGET_HOURS_REQUIRED');

    if (!Array.isArray(module.lessons) || module.lessons.length === 0) {
      err(issues, `${mp}.lessons`, 'Module must contain at least one lesson', 'MODULE_LESSONS_REQUIRED');
      continue;
    }

    const seenLessonOrder = new Set<number>();
    let moduleHasAssessment = false;
    let moduleHasPractical = false;

    for (const [li, lesson] of module.lessons.entries()) {
      validateLessonCore(lesson, module, issues, mi, li);
      validateLessonCompliance(lesson, issues, mi, li, profile);

      totalMinutes += lesson.durationMinutes || 0;

      if (seenLessonOrder.has(lesson.orderIndex)) {
        err(issues, `${mp}.lessons[${li}].orderIndex`, 'Duplicate lesson orderIndex within module', 'LESSON_ORDER_DUPLICATE');
      } else {
        seenLessonOrder.add(lesson.orderIndex);
      }

      if (lesson.lessonType === 'quiz')        { quizLessons++;        moduleHasAssessment = true; }
      if (lesson.lessonType === 'practical')   { practicalLessons++;   moduleHasPractical  = true; }
      if (lesson.lessonType === 'checkpoint')  { checkpointLessons++;  moduleHasAssessment = true; }
      if (lesson.lessonType === 'exam')        { examLessons++;        moduleHasAssessment = true; }
      if (lesson.lessonType === 'fieldwork')     fieldworkLessons++;
      if (lesson.lessonType === 'observation')   observationLessons++;
      if (lesson.practicalRequired)              moduleHasPractical = true;

      const dk = lesson.domainKey ?? module.domainKey;
      if (dk) domainHours[dk] = (domainHours[dk] ?? 0) + (lesson.durationMinutes || 0) / 60;

      competencyCount += lesson.competencyChecks?.length ?? 0;
    }

    if (module.quizRequired && !moduleHasAssessment)
      err(issues, mp, 'Module marked quizRequired but has no assessment lesson', 'MODULE_ASSESSMENT_REQUIRED');

    if (module.practicalRequired && !moduleHasPractical)
      err(issues, mp, 'Module marked practicalRequired but has no practical lesson', 'MODULE_PRACTICAL_REQUIRED');
  }

  const totalHours = totalMinutes / 60;

  if (totalHours < template.minimumHours)
    err(issues, 'minimumHours',
      `Total hours (${totalHours.toFixed(2)}) are below minimumHours (${template.minimumHours})`,
      'TOTAL_HOURS_BELOW_PROGRAM_MINIMUM');

  validateRequiredDomains(profile.requiredDomains, domainHours, issues);

  if (template.requiresFinalExam) {
    const hasExam = (template.modules ?? []).some(m => m.lessons.some(l => l.lessonType === 'exam'));
    if (!hasExam)
      err(issues, 'finalExam', 'Program requires final exam but no exam lesson exists', 'FINAL_EXAM_LESSON_MISSING');
  }

  return {
    ok: !issues.some(i => i.severity === 'error'),
    issues,
    stats: {
      moduleCount: template.modules?.length ?? 0,
      lessonCount: (template.modules ?? []).reduce((s, m) => s + m.lessons.length, 0),
      totalMinutes,
      totalHours,
      quizLessons,
      practicalLessons,
      checkpointLessons,
      examLessons,
      fieldworkLessons,
      observationLessons,
      domainHours,
      competencyCount,
    },
    profileKey: profile.profileKey,
    profileLabel: profile.profileLabel,
  };
}
