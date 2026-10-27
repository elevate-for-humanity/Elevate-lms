import { createHash } from 'crypto';
import type { ProgramBuilderTemplate } from './schema';
import type { CredentialConfig } from './credential-engine/registry-loader';
import { validateCredentialAuthority } from './credential-engine/registry-loader';

export type ObjectiveCoverageRow = {
  objectiveId: string;
  title: string;
  requiredWeight: { min: number; max: number };
  lessons: string[];
  assessmentQuestions: number;
  practicals: number;
  covered: boolean;
};

export type ObjectiveCoverageReport = {
  registryKey: string;
  standardVersion: string;
  standardFingerprint: string;
  generatedAt: string;
  coveragePercent: number;
  publishable: boolean;
  errors: string[];
  objectives: ObjectiveCoverageRow[];
};

export function fingerprintCredentialStandard(config: CredentialConfig): string {
  const canonical = JSON.stringify({
    authority: config.authority,
    objectives: (config.objectives ?? []).map((objective) => ({
      ...objective,
      skills: [...objective.skills].sort(),
    })),
  });
  return createHash('sha256').update(canonical).digest('hex');
}

export function buildObjectiveCoverageReport(
  template: ProgramBuilderTemplate,
  standard: CredentialConfig,
  now = new Date(),
): ObjectiveCoverageReport {
  const errors = validateCredentialAuthority(standard);
  const lessons = template.modules.flatMap((module) => module.lessons);
  const rows = (standard.objectives ?? []).map((objective) => {
    const mapped = lessons.filter(
      (lesson) =>
        lesson.domainKey === objective.id ||
        lesson.competencyChecks?.some(
          (check) => check.domainKey === objective.id || check.key === objective.id,
        ),
    );
    const assessmentQuestions = mapped.reduce(
      (sum, lesson) =>
        sum +
        (lesson.quizQuestions ?? []).filter(
          (question) =>
            question.domainKey === objective.id || question.competencyKeys?.includes(objective.id),
        ).length,
      0,
    );
    const practicals = mapped.filter(
      (lesson) =>
        lesson.practicalRequired ||
        ['practical', 'lab', 'fieldwork', 'observation'].includes(lesson.lessonType),
    ).length;
    const covered =
      mapped.length > 0 && assessmentQuestions >= 2 && (!objective.requiresLab || practicals > 0);
    return {
      objectiveId: objective.id,
      title: objective.title,
      requiredWeight: { min: objective.weightMin, max: objective.weightMax },
      lessons: mapped.map((lesson) => lesson.slug),
      assessmentQuestions,
      practicals,
      covered,
    };
  });
  const covered = rows.filter((row) => row.covered).length;
  const coveragePercent = rows.length ? Math.round((covered / rows.length) * 100) : 0;
  if (coveragePercent !== 100)
    errors.push(`objective coverage is ${coveragePercent}%; 100% is required`);
  if (template.regulatory.standardRegistryKey !== standard.authority?.registryKey) {
    errors.push('course registry key does not match the selected standard');
  }
  if (template.regulatory.governingStandardVersion !== standard.authority?.version) {
    errors.push('course standard version does not match the selected standard');
  }
  const standardFingerprint = fingerprintCredentialStandard(standard);
  if (
    template.regulatory.standardFingerprint &&
    template.regulatory.standardFingerprint !== standardFingerprint
  ) {
    errors.push('course was aligned to a different standard fingerprint');
  }
  return {
    registryKey: standard.authority?.registryKey ?? '',
    standardVersion: standard.authority?.version ?? '',
    standardFingerprint,
    generatedAt: now.toISOString(),
    coveragePercent,
    publishable: errors.length === 0,
    errors,
    objectives: rows,
  };
}
